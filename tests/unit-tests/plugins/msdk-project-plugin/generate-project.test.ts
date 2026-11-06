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
import MsdkProjectPlugin from "@plugins/msdk-project-plugin/index.js";
import {
  directoryExists,
  fileExists,
  isDebug,
  loadPluginInfoSync,
  resolveManifestDst,
} from "@utilities/test-utilities.js";
import { joinPath } from "@utilities/path-utilities.js";
import { findJsonFiles, validateJsonFile } from "@utilities/validate-json.js";

const PROJECT_MANIFEST = "plugins/dist/msdk-project-plugin/.cfsplugin";
const WORKSPACE_MANIFEST = "plugins/dist/default-workspace-plugin/.cfsplugin";

const DATA_DIR = "tests/unit-tests/plugins/msdk-project-plugin/data";
const WORKSPACE_NAME = "test-workspace";

/**
 * The only project output that varies by SoC/core is the SEGGER Ozone
 * `*.jdebug` file. Its destination name is chosen by a ternary on
 * `context.soc` and gated by a condition on `context.coreId`
 * (see `features.project.templates` in the manifest):
 *   - max32657 / max32658  -> `m33.jdebug`
 *   - anything else        -> `m4.jdebug`
 *   - coreId not in {CM4, CM4-0, CM33, CM55} -> no `.jdebug` emitted
 *
 * Additionally, MAX32666 CM4-1 generates `main_core1.c` and skips several
 * templates (project.mk, settings.json, Makefile, launch.json, cfs.tasks.json,
 * flash.gdb).
 *
 * These are the equivalence classes for `generateProject`; one representative
 * per class covers the branch without re-running every SoC that maps to
 * `m4.jdebug`. `expectedJdebug` is hardcoded (NOT derived from the manifest)
 * so a broken dst ternary or condition is caught rather than mirrored.
 *
 * `expectedPresent` / `expectedAbsent` are likewise hardcoded so regressions
 * in conditional template conditions or dynamic dst expressions are caught
 * independently of the manifest evaluation used by the matrix.
 */
interface GenerateProjectCase {
  label: string;
  soc: string;
  board: string;
  package: string;
  coreId: string;
  projectName: string;
  expectedJdebug: string | null;
  expectedToolchain: string;
  expectedPresent: string[];
  expectedAbsent: string[];
}

const GENERATE_PROJECT_CASES: GenerateProjectCase[] = [
  {
    label: "m4 core (default mapping)",
    soc: "MAX32690",
    board: "EvKit_V1",
    package: "tqfn",
    coreId: "CM4",
    projectName: "m4",
    expectedJdebug: "m4.jdebug",
    expectedToolchain: "gnu_arm_toolchain",
    expectedPresent: [
      "src/main.c",
      "project.mk",
      "Makefile",
      ".vscode/settings.json",
      ".vscode/launch.json",
      ".vscode/cfs.tasks.json",
      ".vscode/flash.gdb",
    ],
    expectedAbsent: ["src/main_core1.c"],
  },
  {
    label: "m33 core (max32657 mapping)",
    soc: "MAX32657",
    board: "EvKit_V1",
    package: "wlp",
    coreId: "CM33",
    projectName: "m33",
    expectedJdebug: "m33.jdebug",
    expectedToolchain: "gnu_arm_toolchain",
    expectedPresent: [
      "src/main.c",
      "project.mk",
      "Makefile",
      ".vscode/settings.json",
      ".vscode/launch.json",
      ".vscode/cfs.tasks.json",
      ".vscode/flash.gdb",
    ],
    expectedAbsent: ["src/main_core1.c"],
  },
  {
    label: "CM4-1 second core on MAX32666 (no .jdebug)",
    soc: "MAX32666",
    board: "EvKit_V1",
    package: "ctbga",
    coreId: "CM4-1",
    projectName: "core1",
    expectedJdebug: null,
    expectedToolchain: "gnu_arm_toolchain",
    expectedPresent: ["src/main_core1.c"],
    expectedAbsent: [
      "src/main.c",
      "project.mk",
      "Makefile",
      ".vscode/settings.json",
      ".vscode/launch.json",
      ".vscode/cfs.tasks.json",
      ".vscode/flash.gdb",
    ],
  },
  {
    label: "RV core (no .jdebug)",
    soc: "MAX32690",
    board: "EvKit_V1",
    package: "tqfn",
    coreId: "RV",
    projectName: "riscv",
    expectedJdebug: null,
    expectedToolchain: "gnu_riscv_toolchain",
    expectedPresent: [
      "src/main.c",
      "project.mk",
      "Makefile",
      ".vscode/settings.json",
      ".vscode/cfs.tasks.json",
      ".vscode/flash.gdb",
    ],
    expectedAbsent: ["src/main_core1.c", ".vscode/launch.json"],
  },
];

function buildMockProject(testCase: GenerateProjectCase): CfsProject {
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
      MsdkBoardName: testCase.board,
      Cflags: "",
    },
  };
}

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

async function emittedJdebugFiles(projectPath: string): Promise<string[]> {
  const entries = await fs.readdir(projectPath, { recursive: true });
  return entries
    .map((entry) => path.basename(entry.toString()))
    .filter((name) => name.endsWith(".jdebug"))
    .sort();
}

describe("MSDK project plugin - generateProject", () => {
  const projectPluginInfo: CfsPluginInfo = loadPluginInfoSync(PROJECT_MANIFEST);
  const workspacePluginInfo: CfsPluginInfo =
    loadPluginInfoSync(WORKSPACE_MANIFEST);
  let projectPlugin: MsdkProjectPlugin;
  let workspacePlugin: GenericPlugin;

  beforeEach(() => {
    projectPlugin = new MsdkProjectPlugin(projectPluginInfo);
    workspacePlugin = new GenericPlugin(workspacePluginInfo);
  });

  afterEach(async () => {
    if (!isDebug()) {
      await fs.rm(DATA_DIR, { recursive: true, force: true });
    }
  });

  describe("generates the declared project files for each core/SoC mapping", () => {
    GENERATE_PROJECT_CASES.forEach((testCase) => {
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

        for (const file of testCase.expectedPresent) {
          expect(
            await fileExists(joinPath(projectPath, file)),
            `${file} should exist for ${testCase.label}`,
          ).to.be.true;
        }

        for (const file of testCase.expectedAbsent) {
          expect(
            await fileExists(joinPath(projectPath, file)),
            `${file} should NOT exist for ${testCase.label}`,
          ).to.be.false;
        }

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
      });
    });
  });

  it("propagates platformConfig properties to the .cfsconfig file", async () => {
    const project = buildMockProject(GENERATE_PROJECT_CASES[0]);
    const workspace = buildMockWorkspace(project);
    const projectPath = joinPath(
      project.path,
      GENERATE_PROJECT_CASES[0].projectName,
    );

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

  it("maps every supported SoC's .jdebug to a covered core bucket", () => {
    const jdebugTemplate = projectPluginInfo.features.project.templates.find(
      (template) => template.dst.includes(".jdebug"),
    );
    if (!jdebugTemplate) {
      expect.fail("manifest should declare a .jdebug template");
    }

    const coveredBuckets = new Set<string>();
    for (const testCase of GENERATE_PROJECT_CASES) {
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
        `SoC ${supportedSoc.name} maps its .jdebug to '${bucket}', which no GENERATE_PROJECT_CASES entry covers - add a representative case`,
      ).to.equal(true);
    }
  });
});
