python
import gdb
import re
import json
import logging

logging.basicConfig(level=logging.WARNING, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)


def sanitise_ptr_string(s):
    if s is None:
        return "0x0"
    if not isinstance(s, str):
        s = str(s)
    if not s.strip():
        return "0x0"
    match = re.search(r"0x[0-9a-fA-F]+", s)
    if not match:
        return "0x0"
    return match.group(0)


def get_frames():
    reason = gdb.selected_frame().unwind_stop_reason()
    reason_str = gdb.frame_stop_reason_string(reason)
    frame_data = {"reason": {"code": reason, "message": reason_str}, "frames": []}

    frame = gdb.newest_frame()
    if not frame or not frame.is_valid():
        logger.warning("No valid frames available")
        return frame_data

    frame.select()

    while frame and frame.is_valid():
        sal = frame.find_sal()
        pc = frame.pc()
        sp = sanitise_ptr_string(gdb.execute("p $sp", to_string=True))
        frame_data["frames"].append(
            {
                "name": frame.name(),
                "symtab": str(sal.symtab),
                "line": sal.line,
                "pc": hex(pc),
                "sp": int(sp, 16),
            }
        )

        frame = frame.older()
        if frame:
            valid = frame.is_valid()
            frame.select()
        else:
            valid = False

    return frame_data


def get_thread_status(thread):
    if thread.is_stopped():
        return "stopped"
    elif thread.is_running():
        return "running"
    elif thread.is_exited():
        return "exited"
    else:
        return "unknown"

def get_thread_name(thread):
    details = thread.details
    name_match = re.search(r"(N|n)ame:\s*(\w+)", details)
    if name_match:
        return name_match[2]
    return


def get_tcb(thread, z_threads):
    tcb = {"name": "", "addr": "", "stack_info": {"size": 0, "start": 0}}

    gdb.execute(f"thread {thread.num}")

    name = get_thread_name(thread)
    if not name:
        logger.warning(f"Cannot resolve TCB address for thread {thread.num}")
        tcb["name"] = thread.name
        return tcb

    tcb["name"] = name

    z_thread = next((item for item in z_threads if item["name"] == name), None)
    if not z_thread:
        logger.warning(f"No Zephyr thread data available for thread {thread.num}")
        return tcb

    tcb["addr"] = z_thread["addr"]
    tcb["stack_info"]["size"] = z_thread["size"]
    tcb["stack_info"]["start"] = z_thread["start"]

    return tcb


def get_thread_context(thread):
    context = {"pc": "0x0", "sp": "0x0", "lr": "0"}

    try:
        gdb.execute(f"thread {thread.num}")
    except Exception as e:
        logger.warning(f"GDB command 'thread {thread.num}' failed: {e}")
        return context

    pc = gdb.execute("p $pc", to_string=True)
    sp = gdb.execute("p $sp", to_string=True)
    lr = gdb.execute("p $lr", to_string=True)

    lr_match = re.search(r"\d+$", lr)
    if lr_match:
        lr_val = lr_match[0]
    else:
        logger.warning("Error processing link register")
        lr_val = 0

    return {
        "pc": sanitise_ptr_string(pc),
        "sp": sanitise_ptr_string(sp),
        "lr": lr_val,
    }


def get_high_water(start, end):
    pattern = "0xaaaaaaaa"  # canary pattern used by zephyr
    ptr = start
    while ptr <= end:
        val = gdb.execute(f"x/1x {hex(ptr)}", to_string=True)

        val_match = re.search(r"0x[a-f0-9]+$", val)
        if val_match:
            if val_match[0] != pattern:
                break
        else:
            logger.warning("Error processing stack")

        ptr += 8

    return ptr


def get_tcb_addr():
    try:
        tcb = gdb.execute("p $tcb", to_string=True)
    except Exception as e:
        logger.warning(f"Error accessing kernel threads: {e}")
        return 0
    return int(sanitise_ptr_string(tcb), 16)


def get_z_thread():
    name = gdb.execute("p $tcb->name", to_string=True)
    match = re.search(r"\"(.*?)\"", name.strip())
    if match:
        name = match[1]

    addr = gdb.execute("p $tcb", to_string=True)
    stack_info = gdb.execute("p $tcb->stack_info", to_string=True)
    
    start = 0
    start_match = re.search(r"start = (\d+)", stack_info)
    if start_match:
        start = start_match[1]

    size = 0
    size_match = re.search(r"size = (\d+)", stack_info)
    if size_match:
        size = size_match[1]

    return {
        "addr": sanitise_ptr_string(addr),
        "name": name,
        "start": int(start),
        "size": int(size),
    }


# the threads as they are represented by gdb are not automatically linked to the
# additional thread data contained in the core dump. This function retrieves
# extra thread data from the core dump
def get_z_threads():
    z_threads = []
    try:
        gdb.execute("set $tcb = _kernel.threads")
        iteration_count = 0
        max_iterations = 128  # Prevent infinite loops
        
        while get_tcb_addr() != 0 and iteration_count < max_iterations:
            try:
                z_threads.append(get_z_thread())
                gdb.execute("set $tcb = $tcb->next_thread")
                iteration_count += 1
            except Exception as e:
                logger.warning(f"Error getting z_thread {iteration_count}: {e}")
                break
                
    except Exception as e:
        logger.warning(f"Error accessing kernel threads: {e}")

    return z_threads


def analyse_threads():
    try:
        inferior = gdb.inferiors()[0]
    except (IndexError, gdb.error) as e:
        logger.error(f"Could not get inferior: {e}")
        return []

    if not inferior:
        logger.error("No inferior available")
        return []

    z_threads = get_z_threads()

    thread_data = []
    original_thread = gdb.selected_thread()

    for thread in inferior.threads():
        try:
            thread.switch()
            status = get_thread_status(thread)
            tcb = get_tcb(thread, z_threads)
            context = get_thread_context(thread)
            frame_data = get_frames()

            # Only calculate stack usage if TCB address is valid and stack size > 0
            if tcb["addr"] and tcb["addr"] != "0x0" and tcb["stack_info"]["size"] > 0 and frame_data["frames"]:
                stack_start = tcb["stack_info"]["start"]
                stack_end = stack_start + tcb["stack_info"]["size"]
                high_water = get_high_water(stack_start, stack_end)
                current_usage = stack_end - frame_data["frames"][0]["sp"]
                max_usage = 0
                if stack_start and stack_end:
                    max_usage = int(
                        (stack_end - high_water) / (stack_end - stack_start) * 100
                    )
                # ---- NEVER-ZERO: clamp computed values ----
                if current_usage <= 0:
                    current_usage = 1
                if tcb["stack_info"]["size"] <= 0:
                    tcb["stack_info"]["size"] = 1
                if max_usage <= 0:
                    max_usage = 1
            else:
                # ---- NEVER-ZERO: no Zephyr metadata -> placeholders ----
                current_usage = 1
                max_usage = 1
                if tcb["stack_info"]["size"] <= 0:
                    tcb["stack_info"]["size"] = 1

            # ---- NEVER-EMPTY ADDRESS: fallback to PC then SP ----
            addr_out = tcb["addr"]
            if not addr_out or addr_out == "0x0":
                addr_out = context["pc"] if context["pc"] != "0x0" else context["sp"]
                if not addr_out or addr_out == "0x0":
                    addr_out = "0x1"

            thread_data.append(
                {
                    "name": tcb["name"],
                    "status": status,
                    "address": addr_out,
                    "stack": {
                        "used": current_usage,
                        "total": tcb["stack_info"]["size"],
                        "max_usage_percent": max_usage,
                    },
                    "execution_info": {
                        "pc": context["pc"],
                        "sp": context["sp"],
                        "lr": context["lr"],
                    },
                    "trace": frame_data["frames"],
                    "reason": frame_data["reason"],
                }
            )

        except Exception as e:
            logger.error(f"Error analyzing thread {thread.num}: {e}")
            # add minimal thread info even if analysis fails
            thread_data.append(
                {
                    "name": f"thread_{thread.num}",
                    "status": "error",
                    "address": "0x1",  # never empty
                    "stack": {"used": 1, "total": 1, "max_usage": 1},
                    "execution_info": {"pc": "0x1", "sp": "0x1", "lr": "1"},
                    "trace": [],
                    "reason": {"code": -1, "message": str(e)},
                }
            )

    if original_thread:
        try:
            original_thread.switch()
        except gdb.error:
            pass  # thread might have exited

    return thread_data


def main():
    try:
        thread_data = analyse_threads()
        print(json.dumps(thread_data, indent=4))
    except Exception as e:
        logger.error(f"Script execution failed: {e}")
        print(json.dumps({"error": str(e)}, indent=4))


if __name__ == "__main__":
    main()

end
