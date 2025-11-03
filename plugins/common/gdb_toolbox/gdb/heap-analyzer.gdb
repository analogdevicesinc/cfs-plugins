python

import gdb, re, json

# ========= helpers =========
def jprint(total=None, used=None, peak=None, message=""):
    print(json.dumps({"total": total or 0, "used": used or 0, "max": peak or 0, "message": message}))

def safe_exec(cmd):
    try: return gdb.execute(cmd, to_string=True) or ""
    except Exception as e: return ""

def ptr_size():
    return gdb.lookup_type('void').pointer().sizeof

def read_bytes(addr, size):
    try:
        mem = gdb.selected_inferior().read_memory(addr, size)
        return bytes(mem)
    except Exception:
        return None

def read_uint(addr, size):
    b = read_bytes(addr, size)
    if b is None: return None
    return int.from_bytes(b, "little", signed=False)

def sym_addr(name):
    try:
        v = gdb.parse_and_eval(f"&{name}")
        return int(v)
    except Exception:
        pass
    try:
        v = gdb.parse_and_eval(name)
        return int(v.address)
    except Exception:
        return None

def array_len(symname):
    # DWARF first
    try:
        v = gdb.parse_and_eval(symname)
        t = v.type.strip_typedefs()
        if t.code == gdb.TYPE_CODE_ARRAY and t.range():
            lo, hi = t.range()
            return int(hi - lo + 1)
    except Exception:
        pass
    # ptype fallback
    txt = safe_exec(f"ptype {symname}")
    m = re.search(r"\[(\d+)\]", txt or "")
    return int(m.group(1)) if m else None

# ptype /o parsing (field offsets)
MEMBER_RE = re.compile(r"^\s*\+0x([0-9a-fA-F]+)\s+(.+?)\s+([_A-Za-z]\w*)\s*;\s*$")
def ptype_members_with_offsets(type_expr):
    txt = safe_exec(f"ptype /o {type_expr}")
    out=[]
    for line in (txt or "").splitlines():
        m = MEMBER_RE.match(line)
        if not m: continue
        out.append({
            "offset": int(m.group(1),16),
            "type": m.group(2).strip(),
            "name": m.group(3)
        })
    return out, txt

def sizeof_type(tn):
    try: return int(gdb.lookup_type(tn).sizeof)
    except Exception:
        # simple fallbacks
        m = tn.strip()
        if m in ("size_t","ssize_t","unsigned long","long"):
            try: return gdb.lookup_type("long").sizeof
            except Exception: return 4
        if m in ("unsigned int","int"): return 4
        if m in ("uint32_t","int32_t"): return 4
        if m in ("uint16_t","int16_t"): return 2
        if m in ("uint8_t","int8_t","unsigned char","char"): return 1
        return None

# ========= main =========
def main():
    # total bytes from backing buffer symbol (same as your script)
    total = None
    for nm in ("kheap__system_heap","z_malloc_heap_mem","system_heap_mem"):
        total = array_len(nm)
        if total: break

    # get z_heap* pointer behind _system_heap
    heap_ptr_expr = "(_system_heap.heap.heap)"
    try:
        p_val = gdb.parse_and_eval(heap_ptr_expr)
        p = int(p_val)
    except Exception as e:
        # cannot evaluate pointer expression at all
        jprint(total, 0, 0, f"Error: {e}")
        return

    # pointer null?
    if p == 0:
        jprint(total, 0, 0, "Error: _system_heap.heap.heap is NULL")
        return

    # quick accessibility probe (read 1 byte)
    if read_bytes(p, 1) is None:
        jprint(total, 0, 0, f"Error: Cannot access memory at address 0x{p:08X}")
        return

    # use ptype /o to discover stats block and its fields
    members, top_txt = ptype_members_with_offsets("*(_system_heap.heap.heap)")
    if not members:
        jprint(total, 0, 0, "Error: Could not enumerate z_heap members (ptype /o failed)")
        return

    stats_mem = None
    for m in members:
        n = (m["name"] or "").lower()
        if "stats" in n:  # matches stats or k_stats etc.
            stats_mem = m
            break

    if not stats_mem:
        jprint(total, 0, 0, "Error: No stats member found in struct z_heap (is CONFIG_SYS_HEAP_RUNTIME_STATS enabled?)")
        return

    stats_type = stats_mem["type"]
    stats_off  = stats_mem["offset"]

    s_members, s_txt = ptype_members_with_offsets(stats_type)
    if not s_members:
        jprint(total, 0, 0, f"Error: Could not enumerate fields of {stats_type}")
        return

    # prefer exact field names, then heuristics
    cur_names  = ["allocated_bytes","cur_allocated_bytes","allocated","used_bytes","bytes_in_use"]
    peak_names = ["max_allocated_bytes","max_allocated","peak_allocated_bytes","peak_used_bytes","max_bytes_in_use"]

    def pick_exact(names):
        for nm in names:
            for m in s_members:
                if m["name"] == nm:
                    return m
        return None

    cur_f  = pick_exact(cur_names)
    peak_f = pick_exact(peak_names)

    def pick_heur(want_peak=False):
        keys = ["peak","max"] if want_peak else ["used","alloc","cur","in_use","bytes"]
        best = None; score_best = -1
        for m in s_members:
            nm = m["name"].lower()
            score = sum(k in nm for k in keys) - (2 if "free" in nm else 0)
            if score > score_best:
                best, score_best = m, score
        return best if score_best > 0 else None

    if cur_f is None:  cur_f  = pick_heur(False)
    if peak_f is None: peak_f = pick_heur(True)

    if not cur_f and not peak_f:
        jprint(total, 0, 0, f"Error: Could not identify used/peak fields in {stats_type}")
        return

    # read the numbers from memory
    def read_field(field):
        if not field: return None
        sz = sizeof_type(field["type"])
        if sz is None: return None
        return read_uint(p + stats_off + field["offset"], sz)

    used = read_field(cur_f)
    peak = read_field(peak_f)

    # clamp/sanity
    if total:
        if used is not None: used = max(0, min(used, total))
        if peak is not None:
            peak = max(0, min(peak, total))
            if used is not None and peak < used:
                peak = used

    msg = ""
    if used is None or peak is None:
        msg = f"Warning: partial stats (used={used}, max={peak})"
    jprint(total or 0, used or 0, peak or 0, msg)

main()
end
