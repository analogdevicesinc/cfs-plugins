#!/usr/bin/env bash
# Downloads CFS data model Conan packages from Cloudsmith and places
# them in data-models/socs/ at the repo root.
#
# Usage:
#   ./scripts/download-datamodels.sh [<pkg/version> ...]
#
# Each argument is a Conan package reference with a pinned version, e.g.:
#   cfs_base_data_models/2.4.0
#
# If no packages are given on the command line, the script reads them
# from scripts/datamodel-packages.conf (one per line, comments ignored).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

REMOTE_NAME="cfs"
REMOTE_URL="https://conan.cloudsmith.io/adi/codefusion-public"

PACKAGES=()

while [[ $# -gt 0 ]]; do
  case $1 in
    -*)     echo "Unknown option: $1" >&2; exit 1 ;;
    *)      PACKAGES+=("$1"); shift ;;
  esac
done

# Fall back to the packages config file when no positional args are given
if [[ ${#PACKAGES[@]} -eq 0 ]]; then
  CONF="$SCRIPT_DIR/datamodel-packages.conf"
  if [[ -f "$CONF" ]]; then
    while IFS= read -r line; do
      line="${line%%#*}"   # strip comments
      line="${line// /}"   # strip whitespace
      line="${line//$'\r'/}"
      [[ -n "$line" ]] && PACKAGES+=("$line")
    done < "$CONF"
  fi
fi

if [[ ${#PACKAGES[@]} -eq 0 ]]; then
  echo "Usage: $0 [<pkg/version> ...]" >&2
  echo "   or: list packages in scripts/datamodel-packages.conf" >&2
  echo "Example: $0 cfs_base_data_models/2.4.0" >&2
  exit 1
fi

# Configure remote
conan remote add "$REMOTE_NAME" "$REMOTE_URL" --force

# Resolve the Conan cache path for a specific package reference
resolve_pkg_path() {
  local pkg_ref="$1"
  local result
  result=$(conan list "${pkg_ref}:*" --format=json)

  local ref_and_id
  local python_bin
  python_bin="$(command -v python3 || command -v python)"
  ref_and_id=$(echo "$result" | "$python_bin" -c "
import json, sys
data = json.load(sys.stdin)
cache = data.get('Local Cache', {})
if not cache:
    sys.exit(1)
ref = next(iter(cache))
revisions = cache[ref].get('revisions', {})
if not revisions:
    sys.exit(1)
rev = next(iter(revisions.values()))
packages = rev.get('packages', {})
if not packages:
    sys.exit(1)
pkg_id = next(iter(packages.keys()))
sys.stdout.write(f'{ref}:{pkg_id}')
")

  conan cache path "$ref_and_id" | tr -d '\r'
}

OUTPUT_DIR="$REPO_ROOT/data-models"
rm -rf "$OUTPUT_DIR/socs"
mkdir -p "$OUTPUT_DIR/socs"

for PKG_REF in "${PACKAGES[@]}"; do
  if [[ "$PKG_REF" != */* ]]; then
    echo "ERROR: Package must include a version (e.g. ${PKG_REF}/2.4.0)" >&2
    exit 1
  fi

  echo "Downloading ${PKG_REF}..."
  conan download "${PKG_REF}:*" -r "$REMOTE_NAME"

  PKG_PATH=$(resolve_pkg_path "$PKG_REF")
  if command -v cygpath >/dev/null 2>&1; then
    PKG_PATH=$(cygpath -u "$PKG_PATH")
  fi

  if [[ -z "$PKG_PATH" || ! -d "$PKG_PATH" ]]; then
    echo "ERROR: Could not resolve package cache path for $PKG_REF" >&2
    exit 1
  fi

  package_count=$(find "$PKG_PATH" -name "*.json" | wc -l)
  if [[ "$package_count" -eq 0 ]]; then
    echo "ERROR: No data model JSON files found in $PKG_REF" >&2
    exit 1
  fi

  find "$PKG_PATH" -name "*.json" \
    -exec cp {} "$OUTPUT_DIR/socs/" \;

  find "$PKG_PATH" -name ".cfsdatamodels" \
    -exec cat {} >> "$OUTPUT_DIR/socs/.cfsdatamodels" \;

  count=$(find "$OUTPUT_DIR/socs" -name "*.json" | wc -l)
  echo "Downloaded $package_count data model file(s) from $PKG_REF ($count total)."
done

# Fix concatenated .cfsdatamodels: replace }{ (possibly separated by whitespace/newlines) with a comma
python_bin="$(command -v python3 || command -v python)"
"$python_bin" -c "
import re, sys
f = sys.argv[1]
with open(f) as fh:
    data = fh.read()
with open(f, 'w') as fh:
    fh.write(re.sub(r'\}\s*\{', ',', data))
" "$OUTPUT_DIR/socs/.cfsdatamodels"
