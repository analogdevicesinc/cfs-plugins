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
import { promises as fs } from "node:fs";
import { expect } from "chai";
import { GenericPlugin, evalNestedTemplateLiterals } from "cfs-plugins-sdk";
import type {
  CfsConfig,
  CfsPluginInfo,
  CfsProject,
  CfsWorkspace,
} from "cfs-types";
import ZephyrProjectPlugin from "@plugins/zephyr-project-plugin/index.js";
import {
  directoryExists,
  fileExists,
  isDebug,
  loadPluginInfoSync,
  resolveManifestDst,
} from "@utilities/test-utilities.js";
import { joinPath } from "@utilities/path-utilities.js";
import { findJsonFiles, validateJsonFile } from "@utilities/validate-json.js";

// Manifests are read from the built `plugins/dist/` output.
const PROJECT_MANIFEST = "plugins/dist/zephyr-project-plugin/.cfsplugin";
const WORKSPACE_MANIFEST = "plugins/dist/default-workspace-plugin/.cfsplugin";

// Scratch directory the suite writes into and cleans after each test.
const DATA_DIR = "tests/unit-tests/plugins/zephyr-project-plugin/data";
const WORKSPACE_NAME = "test-workspace";

/**
 * The only project output that varies by SoC/core is the SEGGER Ozone
 * `*.jdebug` file. Its destination name is chosen by a ternary on `context.soc`
 * and gated by a condition on `context.coreId`
 * (see `features.project.templates` in the manifest):
 *   - max32657 / max32658  -> `m33.jdebug`
 *   - max32666             -> `cpu0.jdebug`
 *   - anything else        -> `m4.jdebug`
 *   - coreId not in {CM4, CM33, CM55, CPU0, CM4-0} -> no `.jdebug` emitted
 *
 * These are the equivalence classes for `generateProject`; one representative
 * per class covers the branch without re-running the 26 SoCs that all map to
 * `m4.jdebug`. `expectedJdebug` is hardcoded (NOT derived from the manifest) so
 * a broken dst ternary or condition is caught rather than mirrored.
 */
interface JdebugCase {
  label: string;
  soc: string;
  board: string;
  package: string;
  coreId: string;
  projectName: string;
  zephyrBoardName: string;
  /** Expected `.jdebug` filename, or null when none must be emitted. */
  expectedJdebug: string | null;
  /** Toolchain package expected in `.cfsdependencies`. */
  expectedToolchain: string;
  /**
   * CFS tool ID provided by `expectedToolchain`, which `.vscode/settings.json`
   * and every `${cfs:tool.path.<id>...}` reference in `launch.json` must use.
   */
  expectedToolchainId: string;
  /** Target triple of the `expectedToolchain` compiler and headers. */
  expectedCompilerPrefix: string;
  /** OpenOCD interface script expected in `.vscode/settings.json`. */
  expectedOpenocdInterface: string;
  /** OpenOCD target script expected in `.vscode/settings.json`. */
  expectedOpenocdTarget: string;
  /** Whether `.vscode/launch.json` is emitted (not for MAX32690 or MAX32655 WLP RV). */
  expectedLaunch: boolean;
}

const JDEBUG_CASES: JdebugCase[] = [
  {
    label: "m4 core (default mapping)",
    soc: "MAX32690",
    board: "AD-APARD32690-SL",
    package: "WLP",
    coreId: "CM4",
    projectName: "max32690-wlp-m4",
    zephyrBoardName: "apard32690/max32690/m4",
    expectedJdebug: "m4.jdebug",
    expectedToolchain: "zephyr_arm_toolchain",
    expectedToolchainId: "arm.zephyr.eabi.toolchain",
    expectedCompilerPrefix: "arm-zephyr-eabi",
    expectedOpenocdInterface: "interface/cmsis-dap.cfg",
    expectedOpenocdTarget: "target/max32690.cfg",
    expectedLaunch: true,
  },
  {
    label: "m33 core (max32657/max32658 mapping)",
    soc: "MAX32657",
    board: "EvKit_V1",
    package: "WLP",
    coreId: "CM33",
    projectName: "max32657-wlp-m33",
    zephyrBoardName: "max32657evkit/max32657",
    expectedJdebug: "m33.jdebug",
    expectedToolchain: "zephyr_arm_toolchain",
    expectedToolchainId: "arm.zephyr.eabi.toolchain",
    expectedCompilerPrefix: "arm-zephyr-eabi",
    expectedOpenocdInterface: "interface/cmsis-dap.cfg",
    expectedOpenocdTarget: "target/max32657.cfg",
    expectedLaunch: true,
  },
  {
    label: "cpu0 core (max32666 mapping)",
    soc: "MAX32666",
    board: "EvKit_V1",
    package: "CTBGA",
    coreId: "CM4-0",
    projectName: "max32666-ctbga-cpu0",
    zephyrBoardName: "max32666evkit/max32666/cpu0",
    expectedJdebug: "cpu0.jdebug",
    expectedToolchain: "zephyr_arm_toolchain",
    expectedToolchainId: "arm.zephyr.eabi.toolchain",
    expectedCompilerPrefix: "arm-zephyr-eabi",
    expectedOpenocdInterface: "interface/cmsis-dap.cfg",
    expectedOpenocdTarget: "target/max32666.cfg",
    expectedLaunch: true,
  },
  {
    label: "core outside the debug list (no .jdebug emitted)",
    soc: "MAX78002",
    board: "EvKit_V1",
    package: "CSBGA",
    coreId: "RV",
    projectName: "max78002-csbga-rv32",
    zephyrBoardName: "max78002evkit/max78002/rv32",
    expectedJdebug: null,
    expectedToolchain: "zephyr_riscv_toolchain",
    expectedToolchainId: "riscv.zephyr.elf.toolchain",
    expectedCompilerPrefix: "riscv64-zephyr-elf",
    expectedOpenocdInterface: "interface/ftdi/olimex-arm-usb-ocd-h.cfg",
    expectedOpenocdTarget: "target/max78002_riscv.cfg",
    expectedLaunch: true,
  },
  {
    label: "MAX32690 RV core (no debug configuration emitted)",
    soc: "MAX32690",
    board: "EvKit_V1",
    package: "TQFN",
    coreId: "RV",
    projectName: "max32690-tqfn-rv32",
    zephyrBoardName: "max32690evkit/max32690/rv32",
    expectedJdebug: null,
    expectedToolchain: "zephyr_riscv_toolchain",
    expectedToolchainId: "riscv.zephyr.elf.toolchain",
    expectedCompilerPrefix: "riscv64-zephyr-elf",
    expectedOpenocdInterface: "interface/ftdi/olimex-arm-usb-ocd-h.cfg",
    expectedOpenocdTarget: "target/max32690_riscv.cfg",
    expectedLaunch: false,
  },
  {
    label: "MAX32655 CTBGA RV core (debug configuration emitted)",
    soc: "MAX32655",
    board: "EvKit_V1",
    package: "CTBGA",
    coreId: "RV",
    projectName: "max32655-ctbga-rv32",
    zephyrBoardName: "max32655evkit/max32655/rv32",
    expectedJdebug: null,
    expectedToolchain: "zephyr_riscv_toolchain",
    expectedToolchainId: "riscv.zephyr.elf.toolchain",
    expectedCompilerPrefix: "riscv64-zephyr-elf",
    expectedOpenocdInterface: "interface/ftdi/olimex-arm-usb-ocd-h.cfg",
    expectedOpenocdTarget: "target/max32655_riscv.cfg",
    expectedLaunch: true,
  },
  {
    label: "MAX32655 WLP RV core (no debug configuration emitted)",
    soc: "MAX32655",
    board: "",
    package: "WLP",
    coreId: "RV",
    projectName: "max32655-wlp-rv32",
    zephyrBoardName: "",
    expectedJdebug: null,
    expectedToolchain: "zephyr_riscv_toolchain",
    expectedToolchainId: "riscv.zephyr.elf.toolchain",
    expectedCompilerPrefix: "riscv64-zephyr-elf",
    expectedOpenocdInterface: "interface/ftdi/olimex-arm-usb-ocd-h.cfg",
    expectedOpenocdTarget: "target/max32655_riscv.cfg",
    expectedLaunch: false,
  },
];

/**
 * Build a fresh Zephyr mock project for `generateProject`. `coreId` is set
 * (distinct from `id`): the manifest's `.jdebug` condition reads
 * `context.coreId`, so omitting it silently suppresses that template.
 */
function buildMockProject(testCase: JdebugCase): CfsProject {
  return {
    id: testCase.coreId,
    coreId: testCase.coreId,
    package: testCase.package,
    board: testCase.board,
    soc: testCase.soc,
    name: "test-project",
    path: `${DATA_DIR}/${WORKSPACE_NAME}`,
    pluginId: "test-plugin-id",
    pluginVersion: "1.0.0",
    platformConfig: {
      ProjectName: testCase.projectName,
      ZephyrVersion: "4.3.0",
      ZephyrBoardName: testCase.zephyrBoardName,
      CMakeArgs: "",
    },
  };
}

/** Build a fresh Zephyr mock workspace whose single project is `project`. */
function buildMockWorkspace(project: CfsProject): CfsWorkspace {
  return {
    workspacePluginId: "test-plugin-id",
    workspacePluginVersion: "1.0.0",
    workspaceName: WORKSPACE_NAME,
    location: DATA_DIR,
    copyrightDate: new Date().getFullYear().toString(),
    dataModelVersion: "1.0.0",
    dataModelSchemaVersion: "1.0.0",
    package: project.package,
    timestamp: new Date().toISOString(),
    board: project.board ?? "",
    soc: project.soc,
    projects: [project],
  };
}

/** Basenames of every `*.jdebug` file emitted under `projectPath`. */
async function emittedJdebugFiles(projectPath: string): Promise<string[]> {
  const entries = await fs.readdir(projectPath, { recursive: true });
  return entries
    .map((entry) => path.basename(entry.toString()))
    .filter((name) => name.endsWith(".jdebug"))
    .sort();
}

describe("Zephyr project plugin - generateProject", () => {
  const projectPluginInfo: CfsPluginInfo = loadPluginInfoSync(PROJECT_MANIFEST);
  const workspacePluginInfo: CfsPluginInfo =
    loadPluginInfoSync(WORKSPACE_MANIFEST);
  let projectPlugin: ZephyrProjectPlugin;
  let workspacePlugin: GenericPlugin;

  beforeEach(() => {
    projectPlugin = new ZephyrProjectPlugin(projectPluginInfo);
    workspacePlugin = new GenericPlugin(workspacePluginInfo);
  });

  afterEach(async () => {
    if (!isDebug()) {
      await fs.rm(DATA_DIR, { recursive: true, force: true });
    }
  });

  // One representative per `.jdebug` equivalence class. Each case asserts:
  //  1. every manifest-declared template/file (condition eval'd) exists,
  //  2. the correct core `.jdebug` is emitted and no other one is (the mapping
  //     checked in both directions, independently of the manifest), and
  //  3. all emitted JSON is valid.
  describe("generates the declared project files for each core/SoC mapping", () => {
    JDEBUG_CASES.forEach((testCase) => {
      it(`generates project files for ${testCase.label}`, async () => {
        const project = buildMockProject(testCase);
        const workspace = buildMockWorkspace(project);
        const projectPath = joinPath(project.path, testCase.projectName);

        await workspacePlugin.generateWorkspace(workspace);
        await projectPlugin.generateProject(projectPath, project);

        expect(
          await directoryExists(projectPath),
          "Project directory should exist after generation",
        ).to.be.true;

        // 1. Every manifest-declared template/file whose condition holds for
        //    this project must exist on disk (nothing declared is missing).
        //    Directory destinations are resolved to the actual file the SDK
        //    writes (see `resolveManifestDst`), so this asserts the file
        //    exists, not merely its parent directory.
        const projectFeature = projectPluginInfo.features.project;
        const expectedFiles = [
          ...projectFeature.templates
            .filter((template) =>
              template.condition
                ? evalNestedTemplateLiterals(template.condition, project) ===
                  "true"
                : true,
            )
            .map((template) =>
              resolveManifestDst(template, "template", project),
            ),
          ...projectFeature.files
            .filter((file) =>
              file.condition
                ? evalNestedTemplateLiterals(file.condition, project) === "true"
                : true,
            )
            .map((file) => resolveManifestDst(file, "file", project)),
        ];

        expect(
          expectedFiles.length,
          "Manifest should declare at least one project template/file",
        ).to.be.greaterThan(0);

        for (const file of expectedFiles) {
          const filePath = joinPath(projectPath, file);
          expect(
            await fileExists(filePath),
            `File ${file} should exist in the project directory`,
          ).to.be.true;
        }

        // 2. The `.jdebug` mapping, asserted against the hardcoded expectation
        //    (not the manifest) so a broken dst ternary or condition is caught,
        //    and in both directions: the right core file is present AND no
        //    other `.jdebug` leaks in.
        const jdebugFiles = await emittedJdebugFiles(projectPath);
        if (testCase.expectedJdebug) {
          expect(
            jdebugFiles,
            `only ${testCase.expectedJdebug} should be emitted for ${testCase.label}`,
          ).to.deep.equal([testCase.expectedJdebug]);
        } else {
          expect(
            jdebugFiles,
            `no .jdebug should be emitted for ${testCase.label}`,
          ).to.be.empty;
        }

        // 3. All emitted JSON must be valid.
        const jsonFiles = await findJsonFiles(DATA_DIR);
        for (const jsonFile of jsonFiles) {
          expect(
            await validateJsonFile(jsonFile),
            `Error: '${jsonFile}' is not a valid JSON file.`,
          ).to.be.true;
        }

        const dependenciesPath = `${projectPath}/.cfs/.cfsdependencies`;
        const dependencies = JSON.parse(
          await fs.readFile(dependenciesPath, "utf-8"),
        ) as { packages: { name: string }[] };
        expect(
          dependencies.packages
            .map(({ name }) => name)
            .filter((name) => name.endsWith("_toolchain")),
        ).to.deep.equal([testCase.expectedToolchain]);

        // 4. The toolchain selected in settings and referenced by the debug
        //    configurations must be the one declared as a dependency.
        const settings = JSON.parse(
          await fs.readFile(`${projectPath}/.vscode/settings.json`, "utf-8"),
        ) as Record<string, unknown>;
        expect(settings["cfs.project.toolchain.id"]).to.equal(
          testCase.expectedToolchainId,
        );

        // 5. OpenOCD must be set up for the debug target of the selected core.
        expect(settings["cfs.openocd.interface"]).to.equal(
          testCase.expectedOpenocdInterface,
        );
        expect(settings["cfs.openocd.target"]).to.equal(
          testCase.expectedOpenocdTarget,
        );

        // 6. IntelliSense must use the compiler and headers of the selected
        //    toolchain.
        const cppProperties = await fs.readFile(
          `${projectPath}/.vscode/c_cpp_properties.json`,
          "utf-8",
        );
        const cppTriples = [
          ...cppProperties.matchAll(
            /\/gnu\/([^/"]+)\/(?:bin\/([^/"]+)-gcc(?:\.exe)?|([^/"]+)\/include)"/g,
          ),
        ].flatMap(([, ...triples]) => triples.filter(Boolean));
        expect(
          cppTriples,
          "c_cpp_properties.json should reference toolchain paths",
        ).to.not.have.lengthOf(0);
        expect(
          [...new Set(cppTriples)],
          "c_cpp_properties.json should only reference the declared toolchain",
        ).to.deep.equal([testCase.expectedCompilerPrefix]);

        const launchPath = `${projectPath}/.vscode/launch.json`;
        if (!testCase.expectedLaunch) {
          expect(
            await fileExists(launchPath),
            `no launch.json should be emitted for ${testCase.label}`,
          ).to.be.false;
          return;
        }

        const launch = await fs.readFile(launchPath, "utf-8");
        const launchToolIds = [
          ...launch.matchAll(
            /\$\{cfs:tool\.path\.([^}]+?)\.(?:debuggerPath|paths)\}/g,
          ),
        ].map(([, toolId]) => toolId);
        expect(
          launchToolIds,
          "launch.json should reference toolchain tools",
        ).to.not.have.lengthOf(0);
        expect(
          [...new Set(launchToolIds)],
          "launch.json should only reference the declared toolchain",
        ).to.deep.equal([testCase.expectedToolchainId]);
      });
    });
  });

  it("propagates platformConfig properties to the .cfsconfig file", async () => {
    const project = buildMockProject(JDEBUG_CASES[0]);
    const workspace = buildMockWorkspace(project);
    const projectPath = joinPath(project.path, JDEBUG_CASES[0].projectName);

    await workspacePlugin.generateWorkspace(workspace);
    await projectPlugin.generateProject(projectPath, project);

    const cfsConfigPath = joinPath(
      project.path,
      ".cfs",
      `${workspace.workspaceName}.cfsconfig`,
    );
    expect(await fileExists(cfsConfigPath), `${cfsConfigPath} should exist`).to
      .be.true;

    const cfsConfigObj = JSON.parse(
      await fs.readFile(cfsConfigPath, "utf-8"),
    ) as CfsConfig;

    const expectedProjectCount = workspace.projects?.length ?? 0;
    expect(cfsConfigObj.Projects).to.have.lengthOf(expectedProjectCount);

    for (const configuredProject of cfsConfigObj.Projects) {
      expect(configuredProject.PlatformConfig).to.exist;
      for (const [prop, value] of Object.entries(project.platformConfig)) {
        expect(configuredProject.PlatformConfig).to.have.property(prop, value);
      }
    }
  });

  // Manifest drift guard: the `.jdebug` destination is chosen by a ternary on
  // `context.soc`, so a newly added SoC could map to a core bucket that none of
  // the JDEBUG_CASES above exercises. Evaluate that ternary for every supported
  // SoC and assert the result is a bucket a case actually covers, so a new
  // mapping fails here rather than silently escaping coverage.
  it("maps every supported SoC's .jdebug to a covered core bucket", () => {
    const jdebugTemplate = projectPluginInfo.features.project.templates.find(
      (template) => template.dst.includes(".jdebug"),
    );
    // Narrowing guard (not just an assertion): `.find` is typed `T | undefined`,
    // and `expect(...).to.not.equal(undefined)` does not narrow for the compiler.
    // `expect.fail` returns `never`, so `jdebugTemplate.dst` below is defined.
    if (!jdebugTemplate) {
      expect.fail("manifest should declare a .jdebug template");
    }

    // Buckets are derived from the cases we actually assert, not hardcoded
    // twice, so the guard tracks whatever JDEBUG_CASES covers.
    const coveredBuckets = new Set<string>();
    for (const testCase of JDEBUG_CASES) {
      if (testCase.expectedJdebug) {
        coveredBuckets.add(testCase.expectedJdebug);
      }
    }

    for (const supportedSoc of projectPluginInfo.supportedSocs) {
      const bucket = evalNestedTemplateLiterals(jdebugTemplate.dst, {
        soc: supportedSoc.name,
      });
      expect(
        coveredBuckets.has(bucket),
        `SoC ${supportedSoc.name} maps its .jdebug to '${bucket}', which no JDEBUG_CASES entry covers - add a representative case`,
      ).to.equal(true);
    }
  });
});
