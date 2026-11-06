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
import ZephyrProjectPlugin from "@plugins/zephyr-project-plugin/index.js";
import { isDebug, loadPluginInfoSync } from "@utilities/test-utilities.js";

// Project-plugin manifest, read from the built `plugins/dist/` output.
const PROJECT_MANIFEST = "plugins/dist/zephyr-project-plugin/.cfsplugin";

// The plugin ships its config patches next to the manifest, under
// `config-patches/<soc>/<coreId>.json`. Discovering them on disk means every
// SoC the plugin supports is covered automatically, with no per-SoC list to
// keep in sync here.
const PLUGIN_DIR = path.dirname(path.resolve(PROJECT_MANIFEST));
const PATCHES_ROOT = path.join(PLUGIN_DIR, "config-patches");

// A SoC id guaranteed to have no config patches (drives the passthrough case).
const UNPATCHED_SOC = "no-such-soc";

const deepClone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

interface ProjectPatchCase {
  soc: string;
  coreId: string;
}

/**
 * Every shipped project patch: for each `config-patches/<soc>/` directory, each
 * non-`system` JSON file, whose basename is the core id the plugin looks up from
 * `config.CoreId`. Flattening every match (rather than the first per SoC) keeps
 * the drift guard honest if a SoC ever ships more than one core patch.
 */
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

/** Build a fresh MAX32690 CM4 project config for `configureProject`. */
function buildMockProjectConfig(): ConfiguredProject {
  return {
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
  };
}

// configureProject previously had no coverage. Both branches are exercised here:
// an unpatched SoC/core returns the config unchanged, and every SoC that ships
// an on-disk config patch has that patch merged into the project config.
describe("Zephyr project plugin - configureProject", () => {
  const projectPluginInfo: CfsPluginInfo = loadPluginInfoSync(PROJECT_MANIFEST);
  let projectPlugin: ZephyrProjectPlugin;

  beforeEach(() => {
    projectPlugin = new ZephyrProjectPlugin(projectPluginInfo);
  });

  it("discovers at least one shipped project patch", () => {
    // Guard against the data-driven cases below silently emitting nothing (e.g.
    // if the plugin was not built), which would look like a false pass.
    expect(projectPatchCases.length).to.be.greaterThan(0);
  });

  it("ships project patches only for supported SoCs", () => {
    // Orphan guard: a config-patches/<soc> dir whose <soc> is not a supported
    // SoC would never be reached at runtime (configureProject looks patches up
    // by the incoming SoC), so it signals a typo or a stale directory.
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
          CoreId: coreId,
        };
        // Snapshot the input so preservation is checked against what was passed.
        const original = deepClone(config) as unknown as Record<
          string,
          unknown
        >;

        const result = (await projectPlugin.configureProject(
          soc,
          config,
        )) as unknown as Record<string, unknown>;

        // 1. Every patch key is applied. Project patches define Partitions /
        //    Peripherals, which the mock config also has, so this also proves
        //    the patch value wins over the pre-existing config value.
        for (const key of Object.keys(patch)) {
          expect(
            result[key],
            `Patch key '${key}' should be merged for ${soc}/${coreId}`,
          ).to.deep.equal(patch[key]);
        }

        // 2. Fields the patch does not set (ProjectId, CoreId, PlatformConfig,
        //    ...) are preserved. This pins the shallow-merge contract:
        //    configureProject merges the patch into the project config; it must
        //    not replace the whole config with the patch.
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

  // Negative test: a patch file that exists but contains invalid JSON must be
  // treated exactly like a missing one. configureProject's JSON.parse throws
  // and is swallowed by its try/catch, so a corrupt shipped patch degrades to
  // "config unchanged" rather than breaking project configuration. Distinct
  // from the passthrough case above, which never finds a file to read.
  describe("ignores a malformed patch file", () => {
    // Point a plugin instance at a scratch dir so the corrupt patch never
    // touches the real dist patches. configureProject only uses the plugin
    // path to locate config-patches/, so a fake .cfsplugin path is enough.
    const SCRATCH_DIR = path.join(
      "tests/unit-tests/plugins/zephyr-project-plugin/data",
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

      const corruptPlugin = new ZephyrProjectPlugin({
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
