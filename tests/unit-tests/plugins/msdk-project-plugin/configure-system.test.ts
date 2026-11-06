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
import MsdkProjectPlugin from "@plugins/msdk-project-plugin/index.js";
import { isDebug, loadPluginInfoSync } from "@utilities/test-utilities.js";

const PROJECT_MANIFEST = "plugins/dist/msdk-project-plugin/.cfsplugin";

const PLUGIN_DIR = path.dirname(path.resolve(PROJECT_MANIFEST));
const PATCHES_ROOT = path.join(PLUGIN_DIR, "config-patches");

const UNPATCHED_SOC = "no-such-soc";

const FALLBACK_PACKAGE = "none";

const deepClone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

interface SystemPatchCase {
  soc: string;
  file: string;
  package: string;
}

function discoverSystemPatchCases(): SystemPatchCase[] {
  return readdirSync(PATCHES_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((dir) =>
      readdirSync(path.join(PATCHES_ROOT, dir.name))
        .filter((file) => file.startsWith("system") && file.endsWith(".json"))
        .map((file): SystemPatchCase => {
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
    BoardName: "EvKit_V1",
    Projects: [
      {
        CoreId: "CM4",
        ProjectId: "CM4",
        PluginId: "string",
        PluginVersion: "string",
        FirmwarePlatform: "msdk",
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
          Cflags: "",
        },
        Peripherals: [{ Name: "Name", Signals: [], Config: {} }],
      },
    ],
  };
}

describe("MSDK project plugin - configureSystem", () => {
  const projectPluginInfo: CfsPluginInfo = loadPluginInfoSync(PROJECT_MANIFEST);
  let projectPlugin: MsdkProjectPlugin;

  beforeEach(() => {
    projectPlugin = new MsdkProjectPlugin(projectPluginInfo);
  });

  it("discovers at least one shipped system patch", () => {
    expect(systemPatchCases.length).to.be.greaterThan(0);
  });

  it("ships system patches only for supported SoCs", () => {
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
          Soc: soc.toUpperCase(),
          Package: pkg,
        };

        const patchKeys = Object.keys(patch);
        if (patchKeys.length > 0) {
          (config as unknown as Record<string, unknown>)[patchKeys[0]] =
            "__original_should_be_overridden__";
        }
        const original = deepClone(config) as unknown as Record<
          string,
          unknown
        >;

        const result = (await projectPlugin.configureSystem(
          config,
        )) as unknown as Record<string, unknown>;

        for (const key of patchKeys) {
          expect(
            result[key],
            `Patch key '${key}' should be applied for ${soc}/${file}`,
          ).to.deep.equal(patch[key]);
        }

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

  describe("ignores a malformed patch file", () => {
    const SCRATCH_DIR = path.join(
      "tests/unit-tests/plugins/msdk-project-plugin/data",
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
      const patchPath = path.join(
        path.dirname(pluginPath),
        "config-patches",
        MALFORMED_SOC,
        "system.json",
      );
      await fs.mkdir(path.dirname(patchPath), { recursive: true });
      await fs.writeFile(patchPath, "{ this is not valid JSON }", "utf-8");

      const corruptPlugin = new MsdkProjectPlugin({
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
