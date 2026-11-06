# SHARC-FX (Xtensa) fault analyzer.
#
# Reads the Xtensa exception state from a halted live debug session and prints
# a fault summary. This does NOT rely on core dump support.
#
# Exception architecture:
#   - XEA3 (SHARC-FX / Eagle-HP): the handler runs at normal level, so PS.EXCM
#     does not flag an active fault and EPC1 is not exposed. The fault is
#     detected from the exception dispatch frames in the backtrace
#     (_GeneralException / xtos_default_exc_handler), and the faulting PC is
#     taken from the frame the dispatcher interrupted. EXCCAUSE uses the XEA3
#     CAUSE/TYPE/SUBTYPE/FULLTYPE bitfield encoding (corebits-xea3.h), decoded
#     here to a symbolic fault name.
#   - XEA2: PS.EXCM flags an active fault, EXCCAUSE is a 0-39 cause index, and
#     EPC1 holds the faulting PC.
#   The core is treated as XEA3 when EPC1 is not available.
#
# Register and frame availability depends on the Xtensa core configuration, so
# every special-register access and derived command is performed defensively: a
# register, cause, or command that is not available is reported as "unavailable"
# and the analysis still completes instead of aborting the command.

python
import gdb

# Xtensa ISA exception-cause table (EXCCAUSE). Causes 32-39 (coprocessor
# disabled) are handled dynamically. Reserved/undefined values fall through
# to an explicit unknown/unsupported label.
EXCCAUSE_TABLE = {
    0:  ("IllegalInstructionCause",    "Illegal instruction"),
    1:  ("SyscallCause",               "SYSCALL instruction"),
    2:  ("InstructionFetchErrorCause", "Processor internal instruction fetch error"),
    3:  ("LoadStoreErrorCause",        "Processor internal load/store error"),
    4:  ("Level1InterruptCause",       "Level-1 interrupt (INTERRUPT register level-1 bit set)"),
    5:  ("AllocaCause",                "MOVSP instruction with regs to spill"),
    6:  ("IntegerDivideByZeroCause",   "Division by zero"),
    7:  ("PCValueCause",              "Illegal next program counter value"),
    8:  ("PrivilegedCause",            "Privileged instruction in non-privileged mode"),
    9:  ("LoadStoreAlignmentCause",    "Unaligned load or store"),
    12: ("InstrPIFDataErrorCause",     "PIF data error during instruction fetch"),
    13: ("LoadStorePIFDataErrorCause", "Synchronous PIF data error during load/store"),
    14: ("InstrPIFAddrErrorCause",     "PIF address error during instruction fetch"),
    15: ("LoadStorePIFAddrErrorCause", "Synchronous PIF address error during load/store"),
    16: ("InstTLBMissCause",           "Error during instruction TLB refill"),
    17: ("InstTLBMultiHitCause",       "Multiple instruction TLB entries matched"),
    18: ("InstFetchPrivilegeCause",    "Instruction fetch at ring level below CRING"),
    20: ("InstFetchProhibitedCause",   "Fetch from page with no execute permission"),
    24: ("LoadStoreTLBMissCause",      "Error during load/store TLB refill"),
    25: ("LoadStoreTLBMultiHitCause",  "Multiple load/store TLB entries matched"),
    26: ("LoadStorePrivilegeCause",    "Load/store at ring level below CRING"),
    28: ("LoadProhibitedCause",        "Load from page with no read permission"),
    29: ("StoreProhibitedCause",       "Store to page with no write permission"),
}

# PS.EXCM (bit 4) is set while a level-1 exception is being handled. When it is
# clear the core is in normal mode and EXCCAUSE/EPC1 only hold saved state from
# a previous exception, so they must not be reported as the current fault.
PS_EXCM_MASK = 0x10


def w(line=""):
    gdb.write(line + "\n")


def read_reg(name):
    """Return the 32-bit value of special register `name`, or None if the
    register is not available on this core/toolchain (reads never abort)."""
    try:
        return int(gdb.parse_and_eval("$" + name)) & 0xFFFFFFFF
    except Exception:
        return None


def run_command(cmd):
    """Execute a gdb command, reporting rather than aborting on failure."""
    try:
        gdb.execute(cmd)
    except Exception as exc:
        w("  (%s unavailable: %s)" % (cmd, exc))


def decode_exccause(cause):
    if cause in EXCCAUSE_TABLE:
        name, desc = EXCCAUSE_TABLE[cause]
        return "%s: %s" % (name, desc)
    if 32 <= cause <= 39:
        return ("Coprocessor%dDisabled: Coprocessor instruction with "
                "coprocessor disabled") % (cause - 32)
    return "unknown/unsupported EXCCAUSE (reserved or configuration-dependent)"


def collect_frames():
    """Return the current backtrace as a list of frames (newest first)."""
    frames = []
    try:
        frame = gdb.newest_frame()
    except Exception:
        return frames
    while frame is not None:
        frames.append(frame)
        try:
            frame = frame.older()
        except Exception:
            break
    return frames


# Frames that mark the Xtensa (XEA3) exception dispatch path. When any appear in
# the backtrace the core is servicing a real exception, regardless of PS, since
# XEA3 runs the handler at normal level where PS.EXCM is meaningless.
DISPATCH_FRAME_HINTS = (
    "xtos_default_exc_handler",
    "_generalexception",
    "_dispatchexception",
    "exc_handler",
)


def is_dispatch_frame(name):
    if not name:
        return False
    lowered = name.lower()
    return any(hint in lowered for hint in DISPATCH_FRAME_HINTS)


def find_fault_frame(frames):
    """Return the frame that raised the exception: the first non-dispatch frame
    older than the outermost dispatch frame. Returns None when the backtrace
    holds no exception dispatch path (no active fault)."""
    last_dispatch = None
    for index, frame in enumerate(frames):
        if is_dispatch_frame(frame.name() or ""):
            last_dispatch = index
    if last_dispatch is None:
        return None
    for frame in frames[last_dispatch + 1:]:
        if not is_dispatch_frame(frame.name() or ""):
            return frame
    return None


def frame_location(frame):
    """Return (pc, function, filename, line) for a frame, tolerating missing
    debug info."""
    pc = None
    try:
        pc = frame.pc() & 0xFFFFFFFF
    except Exception:
        pass
    name = frame.name() or "??"
    filename = None
    line = None
    try:
        sal = frame.find_sal()
        if sal is not None and sal.symtab is not None:
            filename = sal.symtab.filename
            line = sal.line
    except Exception:
        pass
    return pc, name, filename, line


def print_registers_block(regs):
    w("=== Xtensa Exception Status Registers ===")
    for label, name in (("EXCCAUSE", "exccause"), ("EXCVADDR", "excvaddr"),
                        ("PS", "ps"), ("EPC1", "epc1")):
        value = regs[name]
        if value is None:
            w("%-8s : unavailable on this core/toolchain" % label)
        else:
            w("%-8s : 0x%08X" % (label, value))
    w()


def report_xea2(regs):
    """XEA2 cores gate on PS.EXCM, decode EXCCAUSE as a cause index, and take the
    faulting PC from EPC1."""
    ps = regs["ps"]
    if ps is None:
        active = None
        w("Exception state: unknown (PS unavailable - PS.EXCM not checked)")
    elif ps & PS_EXCM_MASK:
        active = True
        w("Exception state: active (PS.EXCM set)")
    else:
        active = False
        w("Exception state: inactive (PS.EXCM clear)")
        w("  No exception is currently active. EXCCAUSE/EPC1 hold saved state")
        w("  from a prior exception and are not decoded as the current fault.")
    if active:
        w()
        w("Decoded exception cause:")
        cause = regs["exccause"]
        if cause is None:
            w("  EXCCAUSE unavailable - cannot decode exception cause")
        else:
            w("  [%d] %s" % (cause, decode_exccause(cause)))
    w()

    w("=== Fault Location ===")
    if active is False:
        w("No active exception (PS.EXCM clear) - EPC1 not decoded")
    elif active is None:
        w("Exception state unknown (PS unavailable) - EPC1 not decoded")
    elif regs["epc1"] is None:
        w("Exception PC (EPC1): unavailable on this core/toolchain")
    else:
        epc1 = regs["epc1"]
        w("Exception PC (EPC1): 0x%08X" % epc1)
        run_command("list *0x%08X" % epc1)
        run_command("info line *0x%08X" % epc1)
        run_command("x/i 0x%08X" % epc1)
    w()


# XEA3 EXCCAUSE bitfield layout (corebits-xea3.h):
#   CAUSE    bits [3:0]   general-exception class
#   TYPE     bits [7:4]   type within the class
#   SUBTYPE  bits [11:8]  subtype within the type
#   FULLTYPE bits [11:0]  combined Subtype/Type/Cause identifier
#   LSFO     bits [13:12] load/store fault qualifier
#   IMPR     bits [15:14] imprecise/precise qualifier
EXCCAUSE_CAUSE_MASK = 0x00F
EXCCAUSE_TYPE_MASK = 0x0F0
EXCCAUSE_SUBTYPE_MASK = 0xF00
EXCCAUSE_FULLTYPE_MASK = 0xFFF
EXCCAUSE_LSFO_MASK = 0x3000
EXCCAUSE_IMPR_MASK = 0xC000

# CAUSE (bits [3:0]) general-exception classes.
XEA3_CAUSE_CLASS = {
    0: ("EXCCAUSE_NONE", "No exception"),
    1: ("EXCCAUSE_INSTRUCTION", "Instruction usage"),
    2: ("EXCCAUSE_ADDRESS", "Addressing usage"),
    3: ("EXCCAUSE_EXTERNAL", "External cause"),
    4: ("EXCCAUSE_DEBUG", "Debug exception"),
    5: ("EXCCAUSE_SYSCALL", "Syscall exception"),
    6: ("EXCCAUSE_HARDWARE", "Hardware failure"),
    7: ("EXCCAUSE_MEMORY", "Memory management"),
    8: ("EXCCAUSE_CP_DISABLED", "Coprocessor disabled"),
}

# FULLTYPE (bits [11:0]) complete exception identifiers (corebits-xea3.h).
XEA3_FULLTYPE = {
    0x101: ("EXC_TYPE_ILL_INST", "ILL(.N) instruction"),
    0x201: ("EXC_TYPE_ILLEGAL_INST", "Illegal instruction (not ILL(.N))"),
    0x111: ("EXC_TYPE_PRIV_INSTRUCTION", "User executing privileged instruction"),
    0x211: ("EXC_TYPE_PRIV_ERI_ACCESS", "User access to privileged ERI"),
    0x121: ("EXC_TYPE_DIVIDE_BY_ZERO", "Integer divide by zero"),
    0x221: ("EXC_TYPE_ILLEGAL_ENTRY", "Entry/Retw with CALL0"),
    0x141: ("EXC_TYPE_FP_INV_OP", "FP invalid operation (V)"),
    0x241: ("EXC_TYPE_FP_DIV_BY_ZERO", "FP divide by zero (Z)"),
    0x341: ("EXC_TYPE_FP_OVERFLOW", "FP overflow (O)"),
    0x441: ("EXC_TYPE_FP_UNDERFLOW", "FP underflow (U)"),
    0x541: ("EXC_TYPE_FP_INEXACT", "FP inexact (I)"),
    0x641: ("EXC_TYPE_FP_UF_INEXACT", "FP underflow and inexact (UI)"),
    0x151: ("EXC_TYPE_NONAR_SAT", "non-AR saturation exception"),
    0x102: ("EXC_TYPE_UNALIGNED_ACCESS", "Unaligned access"),
    0x112: ("EXC_TYPE_INVALID_PC", "PC out of range"),
    0x122: ("EXC_TYPE_INVALID_TCM", "Invalid TCM access"),
    0x222: ("EXC_TYPE_UNALIGNED_OTHER", "Unaligned access to IMEM/XLMI/Device"),
    0x322: ("EXC_TYPE_IRAM_LDST", "IRAM ld/st wrong instruction/slot"),
    0x422: ("EXC_TYPE_CROSS_MEM_ACCESS", "Cross memory/MPU access"),
    0x522: ("EXC_TYPE_INVALID_MSPACE", "Access outside valid memory space"),
    0x622: ("EXC_TYPE_UNSUPP_ATOMIC_OP", "Atomic op not supported by memory type"),
    0x722: ("EXC_TYPE_UNSPEC_IFETCH", "Unspecified ifetch error"),
    0x142: ("EXC_TYPE_LINE_LOCK", "Unlockable cache line"),
    0x242: ("EXC_TYPE_EXT_ATOMIC_LOCKED", "External atomic to locked cache line"),
    0x342: ("EXC_TYPE_BP_DOWNGRADE", "Large downgrade block prefetch"),
    0x442: ("EXC_TYPE_L1_HITMISS", "L1S hit and L1V miss"),
    0x152: ("EXC_TYPE_FLIX_OVERLAP", "FLIX with overlap stores"),
    0x162: ("EXC_TYPE_GS_IDX_TOO_LARGE", "Gather/scatter index too large"),
    0x262: ("EXC_TYPE_GS_UNALIGNED_ADDR", "Gather/scatter unaligned address"),
    0x362: ("EXC_TYPE_GS_UNCORR_ERROR", "Gather/scatter uncorrectable ECC/parity error"),
    0x103: ("EXC_TYPE_BUS_ADDR_ERR", "Bus decode/address error"),
    0x203: ("EXC_TYPE_BUS_CASTOUT_ADDR", "Castout decode/address write bus error"),
    0x113: ("EXC_TYPE_BUS_DATA_ERR", "Bus slave/data error"),
    0x213: ("EXC_TYPE_BUS_CASTOUT_ERR", "Castout slave/data write bus error"),
    0x123: ("EXC_TYPE_BUS_TIMEOUT", "Bus timeout"),
    0x223: ("EXC_TYPE_BUS_CASTOUT_TO", "Castout write - bus timeout"),
    0x133: ("EXC_TYPE_BUS_ATOMIC_OP", "Atomic op not supported by slave"),
    0x143: ("EXC_TYPE_PT_BUS_ADDR_ERR", "Bus decode/address error, page table walk"),
    0x243: ("EXC_TYPE_PT_CASTOUT_ADDR", "Castout decode/address write bus error, page table walk"),
    0x153: ("EXC_TYPE_PT_BUS_DATA_ERR", "Bus slave/data error, page table walk"),
    0x253: ("EXC_TYPE_PT_CASTOUT_DATA", "Castout slave/data write bus error, page table walk"),
    0x163: ("EXC_TYPE_PT_BUS_TIMEOUT", "Bus timeout, page table walk"),
    0x263: ("EXC_TYPE_PT_CASTOUT_BUS", "Castout write - bus timeout, page table walk"),
    0x104: ("EXC_TYPE_SINGLE_STEP", "Single-step exception"),
    0x114: ("EXC_TYPE_BREAK1", "Break1 instruction"),
    0x214: ("EXC_TYPE_BREAKN", "Break.N instruction"),
    0x314: ("EXC_TYPE_BREAK", "Break instruction"),
    0x044: ("EXC_TYPE_IBREAK", "IBreak match"),
    0x054: ("EXC_TYPE_DBREAK", "DBreak match"),
    0x064: ("EXC_TYPE_STACK_LIMIT", "Stack limit exceeded"),
    0x264: ("EXC_TYPE_KERNEL_STACK_LIMIT", "Kernel stack limit exceeded"),
    0x364: ("EXC_TYPE_INTR_STACK_LIMIT", "Interrupt stack limit exceeded"),
    0x005: ("EXC_TYPE_SYSCALL", "Syscall exception (subtype = imm4)"),
    0x146: ("EXC_TYPE_TAG_READ", "Uncorrectable tag read exception"),
    0x246: ("EXC_TYPE_CLEAN_DATA_READ", "Uncorrectable clean data read"),
    0x346: ("EXC_TYPE_DATA_READ", "Uncorrectable data read"),
    0x446: ("EXC_TYPE_CASTOUT_UADDR", "Uncorrectable castout at unknown address"),
    0x546: ("EXC_TYPE_CASTOUT_ADDR", "Uncorrectable castout at known address"),
    0x646: ("EXC_TYPE_HARD_ERROR", "Loop on Hard Error Detected"),
    0x156: ("EXC_TYPE_BUS_ERROR", "Uncorrectable bus error"),
    0x107: ("EXC_TYPE_ACCESS_VIOLATION_1", "Access prohibited, subtype 1"),
    0x207: ("EXC_TYPE_ACCESS_VIOLATION_2", "Access prohibited, subtype 2"),
    0x307: ("EXC_TYPE_ACCESS_VIOLATION_3", "Access prohibited, subtype 3"),
    0x117: ("EXC_TYPE_UNDEFINED_ATTR_1", "Undefined attribute, subtype 1"),
    0x217: ("EXC_TYPE_UNDEFINED_ATTR_2", "Undefined attribute, subtype 2"),
    0x317: ("EXC_TYPE_UNDEFINED_ATTR_3", "Undefined attribute, subtype 3"),
    0x127: ("EXC_TYPE_TLB_CONFLICT", "TLB conflict (e.g. multihit)"),
}


def decode_exccause_xea3(exccause):
    """Split an XEA3 EXCCAUSE value into its fields and resolve the FULLTYPE and
    CAUSE class to their symbolic names (corebits-xea3.h)."""
    cause = exccause & EXCCAUSE_CAUSE_MASK
    type_ = (exccause & EXCCAUSE_TYPE_MASK) >> 4
    subtype = (exccause & EXCCAUSE_SUBTYPE_MASK) >> 8
    fulltype = exccause & EXCCAUSE_FULLTYPE_MASK
    lsfo = (exccause & EXCCAUSE_LSFO_MASK) >> 12
    impr = (exccause & EXCCAUSE_IMPR_MASK) >> 14
    class_name, class_desc = XEA3_CAUSE_CLASS.get(
        cause, ("reserved", "reserved/undefined cause"))
    return {
        "cause": cause, "type": type_, "subtype": subtype,
        "fulltype": fulltype, "lsfo": lsfo, "impr": impr,
        "class_name": class_name, "class_desc": class_desc,
        "full": XEA3_FULLTYPE.get(fulltype),
    }


def report_xea3(regs, fault_frame):
    """XEA3 cores run the handler at normal level, so PS.EXCM does not flag an
    active fault and EPC1 is not exposed. Detect the fault from the exception
    dispatch frames in the backtrace and take the faulting PC from the frame the
    dispatcher interrupted."""
    if fault_frame is None:
        w("Exception state: inactive (no XEA3 exception dispatcher in backtrace)")
        w("  No exception is currently active. EXCCAUSE holds saved state from a")
        w("  prior exception and is not decoded as the current fault.")
        w()
        w("=== Fault Location ===")
        w("No XEA3 exception dispatcher in the backtrace - no active fault")
        w()
        return

    w("Exception state: active (reached the XEA3 exception dispatcher)")
    w()
    w("Decoded exception cause:")
    exccause = regs["exccause"]
    if exccause is None:
        w("  EXCCAUSE unavailable - cannot decode exception cause")
    else:
        fields = decode_exccause_xea3(exccause)
        w("  EXCCAUSE : 0x%08X" % exccause)
        if fields["full"] is not None:
            const_name, desc = fields["full"]
            w("  FULLTYPE : 0x%03X -> %s (%s)" % (
                fields["fulltype"], const_name, desc))
        else:
            w("  FULLTYPE : 0x%03X (no symbolic name - reserved or"
              " configuration-dependent)" % fields["fulltype"])
        w("  CAUSE    : %d (%s - %s)" % (
            fields["cause"], fields["class_name"], fields["class_desc"]))
        w("  TYPE     : %d    SUBTYPE : %d" % (fields["type"], fields["subtype"]))
        w("  LSFO     : %d    IMPR    : %d" % (fields["lsfo"], fields["impr"]))
    w()

    w("=== Fault Location ===")
    pc, name, filename, line = frame_location(fault_frame)
    if pc is not None:
        w("Faulting PC: 0x%08X in %s" % (pc, name))
    else:
        w("Faulting frame: %s" % name)
    if filename is not None and line:
        w("Location: %s:%d" % (filename, line))
    if pc is not None:
        run_command("list *0x%08X" % pc)
        run_command("info line *0x%08X" % pc)
        run_command("x/i 0x%08X" % pc)
    w()


w("=== Xtensa Fault Status Analysis ===")
w("====================================")
w()

regs = {name: read_reg(name) for name in ("exccause", "excvaddr", "ps", "epc1")}
frames = collect_frames()
fault_frame = find_fault_frame(frames)

# EPC1 is an XEA2-only register; a core that does not expose it is XEA3.
is_xea3 = regs["epc1"] is None
w("Exception architecture: %s" % ("XEA3" if is_xea3 else "XEA2"))
w()

print_registers_block(regs)

if is_xea3:
    report_xea3(regs, fault_frame)
else:
    report_xea2(regs)

w("=== Stack Trace ===")
run_command("backtrace")
w()
w("=== Registers ===")
run_command("info registers")
end
