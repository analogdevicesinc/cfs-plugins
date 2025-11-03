python
import gdb, re, json, logging, time, struct
logging.basicConfig(level=logging.WARNING, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

# -------------------- speed knobs --------------------
TIME_BUDGET_SEC      = 1.5     # hard cap for RAM scan (seconds). 0 = no cap
SCAN_BLOCK_BYTES     = 65536   # read_memory block size for scanning (64 KiB)
SCAN_ALIGN           = 4       # ESF candidates are word-aligned
MAX_SCAN_BYTES_PER_R = 2<<20   # per RAM range cap (2 MiB). 0 = no cap
MAX_CANDIDATES       = 64      # stop collecting after this many candidates (keeps classify fast)
THREADS_ON_DEMAND    = True    # only walk threads if we need the context-switch heuristic
SYMBOLIZE_PC         = True    # true = do line/symbol lookup, false = faster but less descriptive
DISASM_ONE_INST      = True    # disassemble 1 instruction at PC (used for EA decode); set False to skip

# -------------------- config knobs (unchanged behavior) --------------------
STRICT_FAULT_ONLY = False      # True => "Unknown" unless ESF is Hard/Mem/Bus/Usage
PROJECT_HINT      = "cfs"      # app path token for heuristics
OUTPUT_PATH       = ""         # set to "crash.json" to also write a file

# -------------------- helpers --------------------
def sanitise_ptr_string(s):
    if s is None: return "0x0"
    if not isinstance(s, str): s = str(s)
    if not s.strip(): return "0x0"
    m = re.search(r"0x[0-9a-fA-F]+", s)
    return m.group(0) if m else "0x0"

def _readable(addr, n=4):
    try:
        gdb.selected_inferior().read_memory(int(addr), n)
        return True
    except Exception:
        return False

def _ru32(addr):
    mem = gdb.selected_inferior().read_memory(int(addr), 4)
    return int.from_bytes(bytes(mem), "little")

def _info_symbol(addr):
    try:
        return gdb.execute(f"info symbol {addr}", to_string=True).strip()
    except Exception:
        return "<?>"

def _emit_payload(payload_or_list):
    if isinstance(payload_or_list, list):
        doc = {"crashCause": payload_or_list}
    else:
        doc = {"crashCause": [payload_or_list]}
    s = json.dumps(doc) + "\n"
    gdb.write(s)
    if OUTPUT_PATH:
        try:
            with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
                f.write(s)
        except Exception:
            pass

# Sections
def _parse_sections():
    try:
        txt = gdb.execute("maintenance info sections", to_string=True)
    except Exception:
        return None, None, []
    text_lo = None; text_hi = None; secs=[]
    sec_re = re.compile(r"\[\d+\]\s+0x([0-9a-fA-F]+)->0x([0-9a-fA-F]+).+?:\s*([^\s]+)\s+(.+)")
    for line in txt.splitlines():
        m = sec_re.search(line)
        if not m: continue
        lo = int(m.group(1),16); hi=int(m.group(2),16)
        name = m.group(3); flags = m.group(4)
        secs.append((lo,hi,name,flags))
        if "text" in name and "CODE" in flags:
            text_lo, text_hi = lo, hi
    return text_lo, text_hi, secs

def _section_for(addr, secs):
    for lo,hi,name,_ in secs:
        if lo <= addr < hi:
            return name
    return "<unmapped>"

# Exception decoder
EXC_NAMES = {1:"Reset",2:"NMI",3:"HardFault",4:"MemManage",5:"BusFault",6:"UsageFault",11:"SVCall",12:"DebugMon",14:"PendSV",15:"SysTick"}
def _exc_name_from_xpsr(xpsr:int)->str:
    ipsr = xpsr & 0x1FF
    if ipsr == 0: return "ThreadMode (0)"
    return f"{EXC_NAMES.get(ipsr, 'IRQ'+str(ipsr))} ({ipsr})"

# SCB fault registers
def _read_scb_faults():
    CFSR, HFSR, MMFAR, BFAR = 0xE000ED28, 0xE000ED2C, 0xE000ED34, 0xE000ED38
    regs={}
    for addr,name in [(CFSR,"cfsr"),(HFSR,"hfsr"),(MMFAR,"mmfar"),(BFAR,"bfar")]:
        try: regs[name]=_ru32(addr)
        except Exception: regs[name]=None
    dec={"present": False}
    cfsr=regs.get("cfsr")
    if cfsr is None: return {**regs, **dec}
    dec["present"]=True
    mmfsr=cfsr & 0xFF; bfsr=(cfsr>>8)&0xFF; ufsr=(cfsr>>16)&0xFFFF
    dec["mmfs"]={"IACCVIOL":bool(mmfsr&1), "DACCVIOL":bool(mmfsr&2), "MUNSTKERR":bool(mmfsr&(1<<3)),
                 "MSTKERR":bool(mmfsr&(1<<4)),"MLSPERR":bool(mmfsr&(1<<5)),"MMARVALID":bool(mmfsr&(1<<7))}
    dec["bfs"]={"IBUSERR":bool(bfsr&1),"PRECISERR":bool(bfsr&2),"IMPRECISERR":bool(bfsr&4),
                "UNSTKERR":bool(bfsr&(1<<3)),"STKERR":bool(bfsr&(1<<4)),"LSPERR":bool(bfsr&(1<<5)),"BFARVALID":bool(bfsr&(1<<7))}
    dec["ufs"]={"UNDEFINSTR":bool(ufsr&1),"INVSTATE":bool(ufsr&2),"INVPC":bool(ufsr&4),"NOCP":bool(ufsr&8),
                "UNALIGNED":bool(ufsr&(1<<8)),"DIVBYZERO":bool(ufsr&(1<<9))}
    dec["hfsr"]=regs.get("hfsr"); dec["mmfar"]=regs.get("mmfar"); dec["bfar"]=regs.get("bfar")
    return {**regs, **dec}

# ------------ ESF recovery & fast scan ------------
def _read_esf(sp):
    return {
        "r0":_ru32(sp+0x00),"r1":_ru32(sp+0x04),"r2":_ru32(sp+0x08),"r3":_ru32(sp+0x0C),
        "r12":_ru32(sp+0x10),"lr":_ru32(sp+0x14),"pc":_ru32(sp+0x18),"xpsr":_ru32(sp+0x1C),
        "sp":sp,"_src":"regs"
    }

def _esf_from_regs():
    try: regs_txt = gdb.execute("info registers", to_string=True)
    except Exception: return None
    have = lambda r: (r in regs_txt)
    def reg(name):
        try: return int(gdb.parse_and_eval(name))
        except Exception: return None
    msp = reg("$msp") if have("$msp") else None
    psp = reg("$psp") if have("$psp") else None
    lr  = reg("$lr")  if have("$lr")  else None
    exc_sp=None
    if lr is not None and (lr & 0xFF000000)==0xFF000000:
        exc_sp = psp if (lr & 4) else msp
    for sp in [exc_sp, msp, psp]:
        if sp and _readable(sp, 32):
            try:
                esf=_read_esf(sp); esf["_lr"]=lr; esf["_score"]=10
                return esf
            except Exception: pass
    return None

def _valid_esf_tuple(r0,r1,lr,pc,xpsr,text_lo,text_hi):
    if (xpsr & (1<<24)) == 0: return False
    if pc is None or pc < text_lo or pc >= text_hi or (pc & 1): return False
    if pc in (0x00000000,0xFFFFFFFF,0xAAAAAAAA,0xDEADBEEF): return False
    return True

def _score_esf(r0,r1,lr,pc,xpsr,text_lo):
    s=0
    if (lr & 0xFF000000)==0xFF000000: s+=2
    if ((pc - text_lo) & 0x3F) < 8: s+=1
    if r0 >= 0x20000000: s+=1
    if r1 >= 0x20000000: s+=1
    ipsr = xpsr & 0x1FF
    if ipsr in (3,4,5,6): s+=10
    elif ipsr in (11,14,15): s-=3
    return s

def _scan_esf_candidates_fast(text_lo, text_hi, secs):
    # scan ALLOC RAM ranges with big reads
    ram = [(lo,hi) for (lo,hi,name,flags) in secs if ("ALLOC" in flags) and (0x20000000 <= lo < 0x40000000)]
    cands=[]; start_time=time.time()
    for lo,hi in ram:
        limit = (MAX_SCAN_BYTES_PER_R if MAX_SCAN_BYTES_PER_R>0 else (hi-lo))
        scanned=0
        addr=lo
        while addr < hi:
            if TIME_BUDGET_SEC>0 and (time.time()-start_time) > TIME_BUDGET_SEC:
                return sorted(cands, key=lambda e:e.get("_score",0), reverse=True)[:MAX_CANDIDATES]
            chunk = min(SCAN_BLOCK_BYTES, hi-addr, limit-scanned) if limit>0 else min(SCAN_BLOCK_BYTES, hi-addr)
            if chunk <= 0: break
            try:
                buf = gdb.selected_inferior().read_memory(addr, chunk).tobytes()
            except Exception:
                addr += chunk
                scanned += chunk
                continue
            # iterate words
            # ESF layout: r0,r1,r2,r3,r12,lr,pc,xpsr (32 bytes)
            for off in range(0, chunk-32+1, SCAN_ALIGN):
                sp = addr + off
                # fast unpack
                try:
                    r0,r1,r2,r3,r12,lr,pc,xpsr = struct.unpack_from("<8I", buf, off)
                except Exception:
                    continue
                if not _valid_esf_tuple(r0,r1,lr,pc,xpsr,text_lo,text_hi):
                    continue
                score=_score_esf(r0,r1,lr,pc,xpsr,text_lo)
                cands.append({"r0":r0,"r1":r1,"r2":r2,"r3":r3,"r12":r12,"lr":lr,"pc":pc,"xpsr":xpsr,"sp":sp,"_src":"scan","_score":score})
                if len(cands) >= MAX_CANDIDATES:
                    return sorted(cands, key=lambda e:e.get("_score",0), reverse=True)[:MAX_CANDIDATES]
            addr += chunk
            scanned += chunk
    return sorted(cands, key=lambda e:e.get("_score",0), reverse=True)[:MAX_CANDIDATES]

def _pick_best_esf(cands):
    FAULT_IPSRS={3,4,5,6}
    for e in cands:
        if (e["xpsr"] & 0x1FF) in FAULT_IPSRS:
            return e
    return cands[0] if cands else None

_MEMOP = re.compile(r":\s*([a-z][a-z0-9\.]*)\s+[^[]*\[\s*(r\d{1,2})\s*(?:,\s*#?(-?0x?[0-9a-fA-F]+))?\s*\]", re.I)
def _disas1(pc):
    if not DISASM_ONE_INST: return ""
    try: return gdb.execute(f"x/1i 0x{pc:x}", to_string=True).strip()
    except Exception: return ""
def _parse_memop(line):
    m = _MEMOP.search(line)
    if not m: return None
    mnem, base, imm = m.group(1).lower(), m.group(2).lower(), m.group(3)
    imm_val = int(imm, 0) if imm else 0
    return (mnem, base, imm_val)

# --------- thread/trace (on-demand & trimmed) ---------
def get_frames_fast():
    # faster than multiple execute() calls: use frame API
    data={"reason":{"code":0,"message":"no reason"},"frames":[]}
    try:
        frame=gdb.newest_frame()
        if not (frame and frame.is_valid()):
            return data
        frame.select()
        while frame and frame.is_valid():
            sal = frame.find_sal()
            pc  = frame.pc()
            try:
                sp  = int(gdb.selected_frame().read_register("sp"))
            except Exception:
                sp  = 0
            data["frames"].append({
                "name": frame.name(),
                "symtab": str(sal.symtab),
                "line": sal.line,
                "pc": hex(pc),
                "sp": sp
            })
            frame = frame.older()
            if frame: frame.select()
    except Exception:
        pass
    return data

def get_thread_name_fast(th):
    try:
        m = re.search(r"(?:N|n)ame:\s*([\w\-\.]+)", th.details)
        return m.group(1) if m else (th.name or "")
    except Exception:
        return th.name or ""

def analyse_threads_on_demand():
    # Only basic info for speed; enough for the heuristic
    out=[]
    try:
        inferior = gdb.inferiors()[0]
    except Exception:
        return out
    cur = gdb.selected_thread()
    for th in inferior.threads():
        try:
            th.switch()
            name = get_thread_name_fast(th)
            frames = get_frames_fast()
            out.append({"name":name,"trace":frames["frames"]})
        except Exception:
            pass
    if cur:
        try: cur.switch()
        except Exception: pass
    return out

def _fallback_suspect_from_threads(threads, project_hint=PROJECT_HINT):
    for th in threads:
        if th["name"]=="main" and th["trace"]:
            for fr in th["trace"]:
                if fr["symtab"] and project_hint in str(fr["symtab"]).lower():
                    return th, fr
            return th, th["trace"][0]
    for th in threads:
        for fr in th["trace"]:
            st=(fr["symtab"] or "").lower()
            if project_hint in st: return th, fr
    for th in threads:
        for fr in th["trace"]:
            st=(fr["symtab"] or "").lower()
            if st and "zephyr" not in st: return th, fr
    for th in threads:
        if th["trace"]: return th, th["trace"][0]
    return None, None

# -------------------- classify & emit --------------------
def _classify_and_emit(esf, secs, text_lo, text_hi, threads=None):
    pc = esf["pc"]; lr = esf["lr"]; xpsr = esf["xpsr"]
    func_sym = _info_symbol(pc) if SYMBOLIZE_PC else ""
    filename=""; lineno=0; func_short=""

    if SYMBOLIZE_PC:
        try:
            sal = gdb.find_pc_line(pc)
            if sal and sal.symtab:
                filename = sal.symtab.fullname() or sal.symtab.filename or ""
                lineno = int(sal.line or 0)
        except Exception: pass
        try:
            blk = gdb.block_for_pc(pc)
            if blk and blk.function:
                func_short = blk.function.print_name
        except Exception: pass

    sym_lower = (func_sym or "").lower()
    ipsr = xpsr & 0x1FF
    if any(s in sym_lower for s in ("arch_swap","z_swap","z_swap_irqlock","pend_sv","pendsv")) or ipsr in (0,14):
        scb = _read_scb_faults()
        upgraded=False; crash_type=None; fault_addr=""; extra=""

        if scb.get("present"):
            if scb["ufs"]["DIVBYZERO"]:       crash_type="Divide-by-zero"; upgraded=True
            elif scb["ufs"]["UNALIGNED"]:     crash_type="Unaligned memory access"; upgraded=True
            elif scb["ufs"]["UNDEFINSTR"]:    crash_type="Undefined instruction"; upgraded=True
            elif scb["ufs"]["INVPC"] or scb["ufs"]["INVSTATE"]:
                crash_type="Corrupt Return Address"; upgraded=True

            if scb["bfs"]["PRECISERR"] and scb["bfs"]["BFARVALID"] and scb.get("bfar") is not None:
                crash_type = crash_type or "RAM Access Fault"
                fault_addr = f"0x{scb['bfar']:08X}"; upgraded=True; extra=" precise data bus error"
            elif scb["mmfs"]["DACCVIOL"] and scb["mmfs"]["MMARVALID"] and scb.get("mmfar") is not None:
                crash_type = crash_type or "RAM Access Fault"
                fault_addr = f"0x{scb['mmfar']:08X}"; upgraded=True; extra=" data access violation"

        details = f"Snapshot during context switch ({_exc_name_from_xpsr(xpsr)}); PC=0x{pc:08X}" + (f" ({func_sym})." if func_sym else ".")
        if scb.get("present"):
            cfsr,hfsr,mmfar,bfar = scb.get("cfsr"),scb.get("hfsr"),scb.get("mmfar"),scb.get("bfar")
            if None not in (cfsr,hfsr,mmfar,bfar):
                details += f" [SCB: CFSR=0x{cfsr:08X} HFSR=0x{hfsr:08X} MMFAR=0x{mmfar:08X} BFAR=0x{bfar:08X}]"

        suspect=""
        if not upgraded:
            if threads is None and THREADS_ON_DEMAND:
                threads = analyse_threads_on_demand()
            if threads:
                th, fr = _fallback_suspect_from_threads(threads, PROJECT_HINT)
                if fr:
                    suspect = f" Heuristic suspect: thread '{th['name']}', frame {fr['name']} @ {fr['symtab']}:{fr['line']} pc={fr['pc']}."
                    try:
                        pc_int = int(fr["pc"],16)
                        filename = fr["symtab"] or filename
                        lineno   = fr["line"] or lineno
                        func_short = fr["name"] or func_short
                        pc = pc_int
                    except Exception: pass

        if upgraded:
            payload = {
                "type": crash_type,
                "address": f"0x{esf['sp']:08X}",
                "pc": f"0x{pc:08X}",
                "symtab": filename if SYMBOLIZE_PC else "",
                "line": lineno if SYMBOLIZE_PC else 0,
                "function": (func_short or (func_sym.split(' ')[0] if func_sym else "")) if SYMBOLIZE_PC else "",
                "faulting_address": fault_addr,
                "details": details + (f" SCB indicates{extra}." if extra else " SCB indicates fault.") + ((" " + suspect.strip()) if suspect else "")
            }
        else:
            payload = {
                "type": "Context Switch (no fault at PC)",
                "address": f"0x{esf['sp']:08X}",
                "pc": f"0x{pc:08X}",
                "symtab": filename if SYMBOLIZE_PC else "",
                "line": lineno if SYMBOLIZE_PC else 0,
                "function": (func_short or (func_sym.split(' ')[0] if func_sym else "")) if SYMBOLIZE_PC else "",
                "faulting_address": "",
                "details": details + suspect
            }
        _emit_payload(payload)
        return

    line = _disas1(pc)
    memop = _parse_memop(line)
    ea=None; ea_sec=None
    if memop:
        _, base, imm = memop
        regs = {"r0":esf["r0"],"r1":esf["r1"],"r2":esf["r2"],"r3":esf["r3"],"r12":esf["r12"],"lr":esf["lr"]}
        if base in regs:
            ea = (regs[base] + imm) & 0xFFFFFFFF
            ea_sec = _section_for(ea, secs)

    sym_lower_all = (func_sym or "").lower()
    if any(t in sym_lower_all for t in ("panic","k_panic","assert","z_fatal")):
        crash_type = "Kernel Panic"
    elif ea is not None and ea < 0x1000:
        crash_type = "Null Dereference"
    elif ea is not None and ea_sec == "text":
        crash_type = "Illegal Code-Region Access"
    elif ea is not None and ea_sec == "<unmapped>":
        crash_type = "Wild/OOB Pointer"
    elif ea is not None and any(s in (ea_sec or "") for s in ("bss","noinit","datas","heap","k_heap")):
        crash_type = "RAM Access Fault"
    elif line and ("udiv" in line or "sdiv" in line):
        crash_type = "Divide-by-zero"
    elif lr in (0,0xFFFFFFFF,0xAAAAAAAA,0xDEADBEEF):
        crash_type = "Corrupt Return Address"
    else:
        crash_type = "Fatal Error"

    exc_name = _exc_name_from_xpsr(xpsr)
    if crash_type == "Kernel Panic":
        details = f"Panic in {(func_short or func_sym or 'unknown') if SYMBOLIZE_PC else 'unknown'} ({exc_name})"
    elif crash_type == "Null Dereference":
        details = f"NULL/near-NULL access at EA=0x{ea:08X} (insn: {line}; {exc_name})"
    elif crash_type == "Illegal Code-Region Access":
        details = f"Access into .text at EA=0x{ea:08X} (insn: {line}; {exc_name})"
    elif crash_type == "Wild/OOB Pointer":
        details = f"Unmapped EA=0x{ea:08X} (insn: {line}; {exc_name})"
    elif crash_type == "RAM Access Fault":
        details = f"EA=0x{ea:08X} in '{ea_sec}' (insn: {line}; {exc_name})"
    elif crash_type == "Divide-by-zero":
        details = f"Division near PC; xPSR=0x{xpsr:08X} ({exc_name})"
    elif crash_type == "Corrupt Return Address":
        details = f"LR(stk)=0x{lr:08X} looks invalid ({exc_name})"
    else:
        details = f"PC=0x{pc:08X}" + (f" ({func_sym})" if func_sym else "") + f"; {exc_name}."

    payload = {
        "type": crash_type,
        "address": f"0x{esf['sp']:08X}",
        "pc": f"0x{pc:08X}",
        "symtab": filename if SYMBOLIZE_PC else "",
        "line": lineno if SYMBOLIZE_PC else 0,
        "function": (func_short or (func_sym.split(' ')[0] if func_sym else "")) if SYMBOLIZE_PC else "",
        "faulting_address": f"0x{ea:08X}" if ea is not None else "",
        "details": details
    }
    _emit_payload(payload)

# -------------------- main --------------------
def _main():
    text_lo, text_hi, secs = _parse_sections()
    if text_lo is None:
        _emit_payload({"type":"Fatal Error","address":"","pc":"","symtab":"","line":0,"function":"","faulting_address":"","details":"No .text section found."})
        return

    cands=[]
    reg_esf = _esf_from_regs()
    if reg_esf: cands.append(reg_esf)
    cands += _scan_esf_candidates_fast(text_lo, text_hi, secs)

    if not cands:
        threads = analyse_threads_on_demand() if THREADS_ON_DEMAND else []
        th, fr = _fallback_suspect_from_threads(threads, PROJECT_HINT)
        if fr:
            pc = int(fr["pc"],16)
            sp_val = fr.get("sp", 0)
            addr_str = f"0x{sp_val:08X}" if isinstance(sp_val, int) and sp_val else ""
            _emit_payload({
                "type":"Fatal Error","address": addr_str, 
                "pc": f"0x{pc:08X}","symtab": fr["symtab"] or "",
                "line": fr["line"] or 0,"function": fr["name"] or "",
                "faulting_address":"","details":"No ESF found in core; using thread trace heuristic to point at most suspicious user frame."
            })
        else:
            _emit_payload({"type":"Fatal Error","address":"","pc":"","symtab":"","line":0,"function":"","faulting_address":"","details":"No ESF and no frames available."})
        return

    esf = _pick_best_esf(cands)

    if STRICT_FAULT_ONLY:
        ipsr = esf["xpsr"] & 0x1FF
        if ipsr not in (3,4,5,6):
            threads = analyse_threads_on_demand() if THREADS_ON_DEMAND else []
            th, fr = _fallback_suspect_from_threads(threads, PROJECT_HINT)
            filename = fr["symtab"] if fr else ""
            line     = fr["line"]   if fr else 0
            func     = fr["name"]   if fr else ""
            pc_str   = fr["pc"]     if fr else "0x0"
            pc_val   = int(pc_str,16) if isinstance(pc_str,str) and pc_str.startswith("0x") else 0
            _emit_payload({
                "type":"Fatal Error","address":f"0x{esf['sp']:08X}",
                "pc": f"0x{pc_val:08X}" if pc_val else "",
                "symtab": filename,"line": line,"function": func,
                "faulting_address":"","details":"Only a context-switch/ThreadMode ESF was found; no fault ESF present in core."
            })
            return

    threads = None
    if THREADS_ON_DEMAND:
        # Only pull threads if we might need them inside classifier (context-switch case)
        # The classifier will call analyse_threads_on_demand() when required.
        threads = None
    else:
        threads = analyse_threads_on_demand()

    _classify_and_emit(esf, secs, text_lo, text_hi, threads)

try:
    _main()
except Exception as ex:
    _emit_payload({"type":"Fatal Error","address":"","pc":"","symtab":"","line":0,"function":"","faulting_address":"","details":f"Internal error: {ex}"})
end
