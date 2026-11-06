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
import type { CfsPluginInfo, ConfiguredProject } from "cfs-types";
import MsdkProjectPlugin from "@plugins/msdk-project-plugin/index.js";
import { isDebug, loadPluginInfoSync } from "@utilities/test-utilities.js";

const PROJECT_MANIFEST = "plugins/dist/msdk-project-plugin/.cfsplugin";

const PLUGIN_DIR = path.dirname(path.resolve(PROJECT_MANIFEST));
const PATCHES_ROOT = path.join(PLUGIN_DIR, "config-patches");

const UNPATCHED_SOC = "no-such-soc";

const deepClone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

interface ProjectPatchCase {
  soc: string;
  coreId: string;
}

function discoverProjectPatchCases(): ProjectPatchCase[] {
  return readdirSync(PATCHES_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((dir) =>
      readdirSync(path.join(PATCHES_ROOT, dir.name))
        .filter((file) => file.endsWith(".json") && !file.startsWith("system"))
        .map(
          (file): ProjectPatchCase => ({
            soc: dir.name,
            coreId: path.basename(file, ".json"),
          }),
        ),
    );
}

const projectPatchCases = discoverProjectPatchCases();

function buildMockProjectConfig(): ConfiguredProject {
  return {
    CoreId: "CM4",
    ProjectId: "CM4",
    PluginId: "com.analog.project.msdk.plugin",
    PluginVersion: "1.0.0",
    FirmwarePlatform: "msdk",
    ExternallyManaged: false,
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
    Peripherals: [{ Name: "Name", Signals: [], Config: {} }],
  };
}

describe("MSDK project plugin - configureProject", () => {
  const projectPluginInfo: CfsPluginInfo = loadPluginInfoSync(PROJECT_MANIFEST);
  let projectPlugin: MsdkProjectPlugin;

  beforeEach(() => {
    projectPlugin = new MsdkProjectPlugin(projectPluginInfo);
  });

  it("discovers at least one shipped project patch", () => {
    expect(projectPatchCases.length).to.be.greaterThan(0);
  });

  it("ships project patches only for supported SoCs", () => {
    const supported = new Set(
      projectPluginInfo.supportedSocs.map((soc) => soc.name.toLowerCase()),
    );
    const orphans = [...new Set(projectPatchCases.map((patch) => patch.soc))]
      .filter((soc) => !supported.has(soc.toLowerCase()))
      .sort();
    expect(
      orphans,
      `config-patches dirs with no matching supported SoC: ${orphans.join(", ")}`,
    ).to.deep.equal([]);
  });

  it("returns the project config unchanged when no patch exists", async () => {
    const config: ConfiguredProject = {
      ...buildMockProjectConfig(),
      CoreId: "cm0",
    };
    const expected = deepClone(config);

    const result = await projectPlugin.configureProject(UNPATCHED_SOC, config);

    expect(result).to.deep.equal(expected);
  });

  describe("merges each shipped SoC's on-disk project patch", () => {
    projectPatchCases.forEach(({ soc, coreId }) => {
      it(`merges the ${soc}/${coreId} patch`, async () => {
        const patch = JSON.parse(
          await fs.readFile(
            path.join(PATCHES_ROOT, soc, `${coreId}.json`),
            "utf-8",
          ),
        ) as Record<string, unknown>;

        const config: ConfiguredProject = {
          ...buildMockProjectConfig(),
          CoreId: coreId.toUpperCase(),
        };
        const original = deepClone(config) as unknown as Record<
          string,
          unknown
        >;

        const result = (await projectPlugin.configureProject(
          soc.toUpperCase(),
          config,
        )) as unknown as Record<string, unknown>;

        for (const key of Object.keys(patch)) {
          expect(
            result[key],
            `Patch key '${key}' should be merged for ${soc}/${coreId}`,
          ).to.deep.equal(patch[key]);
        }

        for (const key of Object.keys(original)) {
          if (!(key in patch)) {
            expect(
              result[key],
              `Field '${key}' absent from the patch should be preserved for ${soc}/${coreId}`,
            ).to.deep.equal(original[key]);
          }
        }
      });
    });
  });

  describe("ignores a malformed patch file", () => {
    const SCRATCH_DIR = path.join(
      "tests/unit-tests/plugins/msdk-project-plugin/data",
      "corrupt-project-plugin",
    );
    const MALFORMED_SOC = "malformed-soc";
    const MALFORMED_CORE = "cm4";

    afterEach(async () => {
      if (!isDebug()) {
        await fs.rm(SCRATCH_DIR, { recursive: true, force: true });
      }
    });

    it("returns the project config unchanged for invalid JSON", async () => {
      const pluginPath = path.resolve(SCRATCH_DIR, ".cfsplugin");
      const patchPath = path.join(
        path.dirname(pluginPath),
        "config-patches",
        MALFORMED_SOC,
        `${MALFORMED_CORE}.json`,
      );
      await fs.mkdir(path.dirname(patchPath), { recursive: true });
      await fs.writeFile(patchPath, "{ this is not valid JSON }", "utf-8");

      const corruptPlugin = new MsdkProjectPlugin({
        ...projectPluginInfo,
        pluginPath,
      });

      const config: ConfiguredProject = {
        ...buildMockProjectConfig(),
        CoreId: MALFORMED_CORE,
      };
      const expected = deepClone(config);

      const result = await corruptPlugin.configureProject(
        MALFORMED_SOC,
        config,
      );

      expect(result).to.deep.equal(expected);
    });
  });
});
