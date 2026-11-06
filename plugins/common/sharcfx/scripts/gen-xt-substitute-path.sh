#!/bin/sh
#
# Copyright (c) 2026 Analog Devices, Inc.
# SPDX-License-Identifier: Apache-2.0

set -eu

if [ "$#" -ne 2 ]; then
    printf '%s\n' "Usage: $0 <debug-executable> <SFX_PATH>" >&2
    exit 1
fi

debug_exe=$1
sfx_path=$2
mapping_file=.vscode/.xt-substitute-path.gdb

if [ -z "$sfx_path" ]; then
    printf '%s\n' "ERROR: Xtensa source mapping requires SFX_PATH" >&2
    exit 1
fi

mkdir -p .vscode
tmp_dir=$(mktemp -d ".vscode/.xt-substitute-path.XXXXXX")
trap 'rm -rf "$tmp_dir"' EXIT

# Runtime libraries embed different build-machine roots in absolute DWARF names.
xt-objdump --dwarf=info "$debug_exe" > "$tmp_dir/dwarf.tmp"
tr '\134' '/' < "$tmp_dir/dwarf.tmp" > "$tmp_dir/dwarf.normalized.tmp"
sed -n -E '/DW_AT_(name|comp_dir)[[:space:]]*:/ {
    s/\r$//
    s/^.*DW_AT_(name|comp_dir)[[:space:]]*: //
    s/^\([^)]*\): //
    s#^((/|[A-Za-z]:/)(.*/)?xtensa-elf/src)(/.*)?$#\1#p
}' "$tmp_dir/dwarf.normalized.tmp" > "$tmp_dir/paths.raw.tmp"
LC_ALL=C sort -u "$tmp_dir/paths.raw.tmp" > "$tmp_dir/paths.tmp"

if [ ! -s "$tmp_dir/paths.tmp" ]; then
    printf '%s\n' "WARNING: no Xtensa runtime source roots found in $debug_exe; no substitutions generated" >&2
    if [ ! -e "$mapping_file" ]; then
        touch "$mapping_file"
    fi
    exit 0
fi

printf '%s' "$sfx_path/Xtensa/XtensaTools/xtensa-elf/src" \
    > "$tmp_dir/destination.raw.tmp"
tr '\134' '/' < "$tmp_dir/destination.raw.tmp" > "$tmp_dir/destination.normalized.tmp"
destination=$(sed 's/"/\\"/g' "$tmp_dir/destination.normalized.tmp")
sed 's/"/\\"/g' "$tmp_dir/paths.tmp" > "$tmp_dir/paths.quoted.tmp"

: > "$tmp_dir/substitute-path.gdb.tmp"
while IFS= read -r src_path; do
    printf 'set substitute-path "%s" "%s"\n' \
        "$src_path" "$destination" \
        >> "$tmp_dir/substitute-path.gdb.tmp"
done < "$tmp_dir/paths.quoted.tmp"

mv -f "$tmp_dir/substitute-path.gdb.tmp" "$mapping_file"
