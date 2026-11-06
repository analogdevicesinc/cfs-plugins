#!/usr/bin/env python3
 # Copyright (c) 2026 Analog Devices, Inc.
 #
 # Licensed under the Apache License, Version 2.0 (the "License");
 # you may not use this file except in compliance with the License.
 # You may obtain a copy of the License at
 #
 #     http://www.apache.org/licenses/LICENSE-2.0
 #
 # Unless required by applicable law or agreed to in writing, software
 # distributed under the License is distributed on an "AS IS" BASIS,
 # WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 # See the License for the specific language governing permissions and
 # limitations under the License.

"""Start and stop the SharcFX QEMU GDB server for one workspace."""

import argparse
import json
import os
import signal
import subprocess
import sys
from pathlib import Path


PID_FILE = Path(__file__).with_name(".qemu-gdbserver.pid.json")
OUTPUT_FILE = Path(__file__).with_name(".qemu.stdout.log")

def read_identity():
    try:
        return json.loads(PID_FILE.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        return None


def process_matches(identity):
    pid = identity.get("pid")
    if not isinstance(pid, int) or pid <= 0:
        return False

    if sys.platform == "win32":
        result = subprocess.run(
            [
                "powershell",
                "-NoProfile",
                "-Command",
                f"(Get-Process -Id {pid} -ErrorAction SilentlyContinue).Path",
            ],
            capture_output=True,
            text=True,
            check=False,
        )
        process_path = result.stdout.strip()
        return bool(process_path) and os.path.normcase(process_path) == os.path.normcase(identity.get("path", ""))

    process_path = Path(f"/proc/{pid}/exe")
    try:
        return process_path.exists() and os.path.samefile(process_path, identity["path"])
    except (FileNotFoundError, KeyError, OSError):
        return False


def stop_server():
    identity = read_identity()
    if identity and process_matches(identity):
        pid = identity["pid"]
        try:
            os.kill(pid, signal.SIGTERM)
        except (ProcessLookupError, PermissionError):
            pass
    try:
        PID_FILE.unlink()
    except FileNotFoundError:
        pass


def start_server(qemu_path, program_path):
    stop_server()
    qemu_path = str(Path(qemu_path).resolve())
    program_path = str(Path(program_path).resolve())
    creation_flags = 0
    if sys.platform == "win32":
        creation_flags = subprocess.CREATE_NEW_PROCESS_GROUP | subprocess.DETACHED_PROCESS

    output = OUTPUT_FILE.open("w", encoding="utf-8")
    process = subprocess.Popen(
        [
            qemu_path,
            "-machine",
            "adsp-arm-m",
            "-kernel",
            program_path,
            "-gdb",
            "tcp::10000",
            "-semihosting",
            "-S",
        ],
        cwd=Path(program_path).parent,
        stdout=output,
        stderr=subprocess.STDOUT,
        creationflags=creation_flags,
        start_new_session=sys.platform != "win32",
    )
    PID_FILE.write_text(
        json.dumps({"pid": process.pid, "path": qemu_path}),
        encoding="utf-8",
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=("start", "stop", "tail"))
    parser.add_argument("--qemu-path")
    parser.add_argument("--program-path")
    args = parser.parse_args()

    if args.action == "stop":
        stop_server()
    elif args.qemu_path and args.program_path:
        start_server(args.qemu_path, args.program_path)
    else:
        parser.error("start requires --qemu-path and --program-path")


if __name__ == "__main__":
    main()
