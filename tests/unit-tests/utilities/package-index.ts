/**
 *
 * Copyright (c) 2026 Analog Devices, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

// Subset of the package manager's `.cfsPackages` index entry we rely on. The
// index maps an installed package name to its on-disk conan package folder,
// exactly what `cfsutil pkg path <name>` returns (a 2.4.0 command that is
// absent from the 2.3.0 kit, so we read the same index file directly).
export interface PackageIndexEntry {
  path: string;
}

export type PackageIndex = Record<string, PackageIndexEntry | undefined>;

/**
 * Returns the directories that may hold the package manager's `.cfsPackages`
 * index, most likely first. `CFS_PACKAGES_DIR` overrides the search entirely.
 */
export function packageAppDataDirs(): string[] {
  const override = process.env.CFS_PACKAGES_DIR;
  if (override) {
    return [override];
  }

  const home = os.homedir();
  let dataDir: string;
  if (process.platform === "win32") {
    dataDir = process.env.LOCALAPPDATA || path.join(home, "AppData", "Local");
  } else if (process.platform === "darwin") {
    dataDir = path.join(home, "Library", "Preferences");
  } else {
    dataDir = process.env.XDG_DATA_HOME || path.join(home, ".local", "share");
  }

  // `getPkgMgrAppDataPath()` places the index at <appData>/packages; env-paths
  // inserts an extra `Data` segment on Windows, so both layouts are offered.
  const base = path.join(dataDir, "com.analog.cfs");
  return [path.join(base, "packages"), path.join(base, "Data", "packages")];
}

/**
 * Reads the package manager's `.cfsPackages` index, returning an empty index
 * when it cannot be found or parsed. Shared so that every consumer resolves
 * the same installation: a layout fix applied to one copy but not another
 * would let dependency preparation and board-dts resolution disagree.
 */
export function readPackageIndex(): PackageIndex {
  for (const dir of packageAppDataDirs()) {
    try {
      const raw = readFileSync(path.join(dir, ".cfsPackages"), "utf-8");
      return JSON.parse(raw) as PackageIndex;
    } catch {
      continue;
    }
  }
  return {};
}
