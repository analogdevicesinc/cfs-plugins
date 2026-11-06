python
# Reads the fatal-error diagnostic globals recorded by libadiutil's
# adi_fatal_error() / adi_fatal_exception() (see adi_fatal_error.h). The caller
# return address / exception PC is written to adi_fatal_error_pc; the general,
# specific and value codes are written to further adi_fatal_* globals whose
# exact names are not published, so they are discovered from the symbol table
# rather than hard-coded. The spin loops sit at the __fatal_error /
# __fatal_exception labels, which distinguish an error from an exception.
import gdb
import re

FATAL_REGEX = "^adi_fatal"
PC_SYMBOL = "adi_fatal_error_pc"
LOOP_LABELS = ["__fatal_error", "__fatal_exception"]


def _discover_symbols(regex):
    try:
        out = gdb.execute("info variables " + regex, to_string=True)
    except gdb.error:
        return []

    names = []
    for raw in out.splitlines():
        line = raw.strip()
        if not line or line.endswith(":"):
            continue
        # Debugging symbol form, e.g. "int adi_fatal_error_pc;".
        match = re.search(r"\b(adi_fatal\w*)\b\s*;", line)
        if not match:
            # Non-debugging form, e.g. "0x90000000  adi_fatal_error_pc".
            match = re.search(r"\b(adi_fatal\w*)\b\s*$", line)
        if match:
            names.append(match.group(1))

    seen = set()
    ordered = []
    for name in names:
        if name not in seen:
            seen.add(name)
            ordered.append(name)
    return ordered


def _read_uint(expr):
    try:
        return int(gdb.parse_and_eval("(unsigned int)" + expr)) & 0xFFFFFFFF
    except gdb.error:
        return None


def _symbolize(addr):
    sym = line = ""
    try:
        sym = gdb.execute("info symbol 0x%08X" % addr, to_string=True).strip()
    except gdb.error:
        pass
    try:
        line = gdb.execute("info line *0x%08X" % addr, to_string=True).strip()
    except gdb.error:
        pass
    return sym, line


def _active_loop():
    pc = _read_uint("$pc")
    if pc is None:
        return None, None
    # When label windows overlap, pick the nearest preceding label so the PC is
    # attributed to the loop it is actually inside, not the first one listed.
    best_label = None
    best_delta = None
    for label in LOOP_LABELS:
        addr = _read_uint("&" + label)
        if addr is None:
            continue
        delta = pc - addr
        if 0 <= delta <= 0x40 and (best_delta is None or delta < best_delta):
            best_label = label
            best_delta = delta
    return best_label, pc


def _print_table(headers, rows):
    """Print a fixed-width table. The GDB Toolbox embeds this output in a
    monospace code block, so columns are space-padded rather than emitted as a
    markdown pipe table (which would not render inside the fence)."""
    widths = [len(h) for h in headers]
    for row in rows:
        for col, cell in enumerate(row):
            widths[col] = max(widths[col], len(cell))

    def _format(cells):
        # First column left-aligned (names); remaining columns right-aligned.
        parts = [cells[0].ljust(widths[0])]
        parts += [cells[col].rjust(widths[col]) for col in range(1, len(cells))]
        return "  ".join(parts).rstrip()

    print(_format(headers))
    print("  ".join("-" * width for width in widths))
    for row in rows:
        print(_format(row))


def main():
    print("=== Fatal Error Global Variables (SHARC-FX) ===")
    print("")

    symbols = _discover_symbols(FATAL_REGEX)
    if not symbols:
        print("No adi_fatal_* global variables found in the symbol table.")
        print("")
        print(
            "The application is not linked against libadiutil, or the fatal "
            "error reporting globals are absent from this build."
        )
        return

    rows = []
    for name in symbols:
        val = _read_uint(name)
        if val is None:
            rows.append((name, "<unreadable>", "<unreadable>"))
        else:
            rows.append((name, "0x%08X" % val, "%d" % val))
    _print_table(("Global variable", "Hex", "Decimal"), rows)
    print("")

    pc = _read_uint(PC_SYMBOL)
    if pc:
        sym, line = _symbolize(pc)
        print("=== Recorded fault location (%s = 0x%08X) ===" % (PC_SYMBOL, pc))
        print("")
        if sym:
            print("Symbol: %s" % sym)
        if line:
            print("Source: %s" % line)
        print("")

    label, cur_pc = _active_loop()
    if label:
        kind = "exception" if "exception" in label else "error"
        print("=== Active spin loop ===")
        print("")
        print(
            "Target is halted in %s (PC = 0x%08X); a fatal %s was reported."
            % (label, cur_pc, kind)
        )
        print("")


try:
    main()
except Exception as exc:  # noqa: BLE001 - report any failure into the GDB log
    print("Fatal error analysis failed: %s" % exc)
end
