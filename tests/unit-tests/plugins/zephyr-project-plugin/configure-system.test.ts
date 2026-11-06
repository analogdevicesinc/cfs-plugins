/**
 *
 * Copyright (c) 2025-2026 Analog Devices, Inc.
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

import path from "node:path";
import { promises as fs, readdirSync } from "node:fs";
import { expect } from "chai";
import type { CfsConfig, CfsPluginInfo } from "cfs-types";
import ZephyrProjectPlugin from "@plugins/zephyr-project-plugin/index.js";
import { isDebug, loadPluginInfoSync } from "@utilities/test-utilities.js";

// Project-plugin manifest, read from the built `plugins/dist/` output.
const PROJECT_MANIFEST = "plugins/dist/zephyr-project-plugin/.cfsplugin";

// The plugin ships its system config patches next to the manifest, under
// `config-patches/<soc>/system.json` (common) or `system-<package>.json`
// (package-specific). Discovering them on disk covers every SoC/package the
// plugin supports without a hand-maintained list here.
const PLUGIN_DIR = path.dirname(path.resolve(PROJECT_MANIFEST));
const PATCHES_ROOT = path.join(PLUGIN_DIR, "config-patches");

// A SoC id guaranteed to have no config patches (drives the passthrough case).
const UNPATCHED_SOC = "no-such-soc";

// A package guaranteed to have no `system-<package>.json` file, so that a
// `system.json` case falls back to the common patch rather than matching a
// package-specific one.
const FALLBACK_PACKAGE = "none";

const deepClone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

interface SystemPatchCase {
  soc: string;
  file: string;
  package: string;
}

/**
 * Every shipped system patch: for each `config-patches/<soc>/` directory, each
 * `system*.json` file. `system.json` is the common patch (exercised with a
 * package that has no package-specific file, so the plugin falls back to it);
 * `system-<pkg>.json` is exercised with `config.Package = <pkg>`.
 */
function discoverSystemPatchCases(): SystemPatchCase[] {
  return readdirSync(PATCHES_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((dir) =>
      readdirSync(path.join(PATCHES_ROOT, dir.name))
        .filter((file) => file.startsWith("system") && file.endsWith(".json"))
        .map((file): SystemPatchCase => {
          // `system.json` -> the common (fallback) patch; `system-<pkg>.json`
          // -> a package-specific patch keyed by <pkg>.
          const packageSpecific = file.startsWith("system-");
          return {
            soc: dir.name,
            file,
            package: packageSpecific
              ? file.slice("system-".length, -".json".length)
              : FALLBACK_PACKAGE,
          };
        }),
    );
}

const systemPatchCases = discoverSystemPatchCases();

/** Build a fresh MAX32690 system config for `configureSystem`. */
function buildMockCfsConfig(): CfsConfig {
  return {
    Copyright:
      "Copyright (c) 2024 Analog Devices, Inc.  All rights reserved. This software is proprietary to Analog Devices, Inc. and its licensors.",
    SchemaVersion: "2.1.0",
    DataModelVersion: "0.0.25",
    Soc: "MAX32690",
    Package: "WLP",
    Pins: [],
    ClockNodes: [],
    Timestamp: new Date().toISOString(),
    BoardName: "AD-APARD32690-SL",
    Projects: [
      {
        CoreId: "CM4",
        ProjectId: "CM4",
        PluginId: "string",
        PluginVersion: "string",
        FirmwarePlatform: "zephyr",
        ExternallyManaged: true,
        Partitions: [
          {
            Name: "Name",
            StartAddress: "0x20000000",
            Size: 2048,
            IsOwner: true,
            Access: "R/W",
            Config: {},
          },
        ],
        PlatformConfig: {
          ProjectName: "m4",
          ZephyrVersion: "4.3.0",
          ZephyrBoardName: "apard32690/max32690/m4",
        },
        Peripherals: [{ Name: "Name", Signals: [], Config: {} }],
      },
    ],
  };
}

// configureSystem previously had no coverage. Both branches are exercised here:
// an unpatched SoC/package returns the config unchanged, and every SoC that
// ships an on-disk system patch has that patch applied (the plugin's
// system-<package>.json -> system.json resolution).
describe("Zephyr project plugin - configureSystem", () => {
  const projectPluginInfo: CfsPluginInfo = loadPluginInfoSync(PROJECT_MANIFEST);
  let projectPlugin: ZephyrProjectPlugin;

  beforeEach(() => {
    projectPlugin = new ZephyrProjectPlugin(projectPluginInfo);
  });

  it("discovers at least one shipped system patch", () => {
    // Guard against the data-driven cases below silently emitting nothing (e.g.
    // if the plugin was not built), which would look like a false pass.
    expect(systemPatchCases.length).to.be.greaterThan(0);
  });

  it("ships system patches only for supported SoCs", () => {
    // Orphan guard: a config-patches/<soc> dir whose <soc> is not a supported
    // SoC would never be reached at runtime (configureSystem looks patches up
    // by the incoming SoC), so it signals a typo or a stale directory.
    const supported = new Set(
      projectPluginInfo.supportedSocs.map((soc) => soc.name.toLowerCase()),
    );
    const orphans = [...new Set(systemPatchCases.map((patch) => patch.soc))]
      .filter((soc) => !supported.has(soc.toLowerCase()))
      .sort();
    expect(
      orphans,
      `config-patches dirs with no matching supported SoC: ${orphans.join(", ")}`,
    ).to.deep.equal([]);
  });

  it("returns the system config unchanged when no patch exists", async () => {
    const config: CfsConfig = {
      ...buildMockCfsConfig(),
      Soc: UNPATCHED_SOC,
      Package: FALLBACK_PACKAGE,
    };
    const expected = deepClone(config);

    const result = await projectPlugin.configureSystem(config);

    expect(result).to.deep.equal(expected);
  });

  describe("applies each shipped SoC's on-disk system patch", () => {
    systemPatchCases.forEach(({ soc, file, package: pkg }) => {
      it(`applies the ${soc}/${file} patch`, async () => {
        const patch = JSON.parse(
          await fs.readFile(path.join(PATCHES_ROOT, soc, file), "utf-8"),
        ) as Record<string, unknown>;

        const config: CfsConfig = {
          ...buildMockCfsConfig(),
          Soc: soc,
          Package: pkg,
        };

        // System patches (e.g. ClockFrequencies) do not overlap the mock's
        // top-level keys, so seed a conflicting value on a patched key to prove
        // the patch value wins over a pre-existing config value.
        const patchKeys = Object.keys(patch);
        if (patchKeys.length > 0) {
          (config as unknown as Record<string, unknown>)[patchKeys[0]] =
            "__original_should_be_overridden__";
        }
        // Snapshot the seeded input so preservation is checked against it.
        const original = deepClone(config) as unknown as Record<
          string,
          unknown
        >;

        const result = (await projectPlugin.configureSystem(
          config,
        )) as unknown as Record<string, unknown>;

        // 1. Every patch key is applied, overriding any pre-existing value.
        for (const key of patchKeys) {
          expect(
            result[key],
            `Patch key '${key}' should be applied for ${soc}/${file}`,
          ).to.deep.equal(patch[key]);
        }

        // 2. Fields the patch does not set (Soc, Package, Projects, ...) are
        //    preserved. This pins the shallow-merge contract: configureSystem
        //    merges the patch into the system config; it must not replace the
        //    whole config with the patch.
        for (const key of Object.keys(original)) {
          if (!(key in patch)) {
            expect(
              result[key],
              `Field '${key}' absent from the patch should be preserved for ${soc}/${file}`,
            ).to.deep.equal(original[key]);
          }
        }
      });
    });
  });

  // Negative test: a patch file that exists but contains invalid JSON must be
  // treated exactly like a missing one. configureSystem's JSON.parse throws and
  // is swallowed by its nested try/catch, so a corrupt shipped patch degrades to
  // "config unchanged" rather than breaking system configuration. Distinct from
  // the passthrough case above, which never finds a file to read.
  describe("ignores a malformed patch file", () => {
    // Point a plugin instance at a scratch dir so the corrupt patch never
    // touches the real dist patches. configureSystem only uses the plugin path
    // to locate config-patches/, so a fake .cfsplugin path is enough.
    const SCRATCH_DIR = path.join(
      "tests/unit-tests/plugins/zephyr-project-plugin/data",
      "corrupt-system-plugin",
    );
    const MALFORMED_SOC = "malformed-soc";

    afterEach(async () => {
      if (!isDebug()) {
        await fs.rm(SCRATCH_DIR, { recursive: true, force: true });
      }
    });

    it("returns the system config unchanged for invalid JSON", async () => {
      const pluginPath = path.resolve(SCRATCH_DIR, ".cfsplugin");
      // Package FALLBACK_PACKAGE has no system-<pkg>.json, so resolution falls
      // back to system.json - which we write as invalid JSON to hit the parse
      // failure on the fallback path.
      const patchPath = path.join(
        path.dirname(pluginPath),
        "config-patches",
        MALFORMED_SOC,
        "system.json",
      );
      await fs.mkdir(path.dirname(patchPath), { recursive: true });
      await fs.writeFile(patchPath, "{ this is not valid JSON }", "utf-8");

      const corruptPlugin = new ZephyrProjectPlugin({
        ...projectPluginInfo,
        pluginPath,
      });

      const config: CfsConfig = {
        ...buildMockCfsConfig(),
        Soc: MALFORMED_SOC,
        Package: FALLBACK_PACKAGE,
      };
      const expected = deepClone(config);

      const result = await corruptPlugin.configureSystem(config);

      expect(result).to.deep.equal(expected);
    });
  });
});
