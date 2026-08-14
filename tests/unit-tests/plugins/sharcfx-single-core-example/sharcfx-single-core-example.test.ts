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

import { promises as fs } from "node:fs";
import path from "node:path";
import { expect } from "chai";
import { GenericPlugin } from "cfs-plugins-sdk";
import type {
  CfsConfig,
  CfsPluginInfo,
  CfsSocDataModel,
  CfsWorkspace,
  ConfiguredProject,
} from "cfs-types";
import { WorkspaceValidationService } from "@services/WorkspaceValidationService.js";
import { CodeGenerationService } from "@services/CodeGenerationService.js";
import { joinPath } from "@utilities/path-utilities.js";
import {
  deleteCreatedWorkspace,
  getSocsBoardsDict,
  isDebug,
  replaceTemplateVariables,
} from "@utilities/test-utilities.js";

const filePath = "plugins/dist/sharcfx-single-core-example/.cfsplugin";
const absolutePath = path.resolve(filePath);
const fileContent = await fs.readFile(absolutePath, "utf-8");
const pluginInfo = JSON.parse(fileContent) as CfsPluginInfo;
pluginInfo.pluginPath = absolutePath;

const supportedSocs = getSocsBoardsDict(pluginInfo);

describe("SHARC-FX Single Core Hello World Tests", () => {
  it("should have at least one supported SoC/board combination", () => {
    expect(Object.keys(supportedSocs).length).to.be.greaterThan(0);
  });

  let genericPlugin: GenericPlugin;
  let cfsWorkspace: CfsWorkspace | undefined;

  beforeEach(() => {
    genericPlugin = new GenericPlugin(pluginInfo);
    cfsWorkspace = undefined;
  });

  afterEach(async () => {
    if (!isDebug() && cfsWorkspace) {
      await deleteCreatedWorkspace(cfsWorkspace);
    }
  });

  describe("GenerateWorkspace_BasicFlow_ShouldGenerateExpectedFiles", () => {
    const expectedWorkspaceFilesBase = [
      ".cfs/.cfsdependencies",
      ".cfs/.cfsworkspace",
      ".cfs/{{soc}}-{{package}}.cfsconfig",
      ".cfs/gdb_toolbox/configs/memory-dump.json",
      ".cfs/gdb_toolbox/configs/register-dump.json",
      "{{soc}}-{{board}}-workspace-gen.code-workspace",
      "sfx/.vscode/c_cpp_properties.json",
      "sfx/.vscode/cfs.tasks.json",
      "sfx/.vscode/launch.json",
      "sfx/.vscode/settings.json",
      "sfx/Makefile",
      "sfx/README.md",
      "sfx/project.mk",
      "sfx/src/linker/specs",
      "sfx/src/main.c",
      "sfx/src/system/adi_initialize.c",
      "sfx/src/system/adi_initialize.h",
    ];

    const workspaceValidationService = new WorkspaceValidationService();

    Object.entries(supportedSocs).forEach(([soc, boards]) => {
      boards.forEach((board) => {
        it(`Using ${soc} SoC with ${board} board`, async () => {
          const socInfo = pluginInfo.supportedSocs.find(
            (s) => s.name === soc && s.board === board,
          );

          if (!socInfo) {
            expect.fail(
              `No supportedSocs entry found for soc="${soc}" board="${board}"`,
            );
          }

          const expectedWorkspaceFiles = expectedWorkspaceFilesBase.map(
            (file) =>
              replaceTemplateVariables(file, {
                soc: soc.toLowerCase(),
                board: board.toLowerCase(),
                package: socInfo.package.toLowerCase(),
              }),
          );

          cfsWorkspace = {
            location:
              "tests/unit-tests/plugins/sharcfx-single-core-example/data",
            workspacePluginId: pluginInfo.pluginId,
            workspacePluginVersion: pluginInfo.pluginVersion,
            workspaceName: `${soc.toLowerCase()}-${board.toLowerCase()}-workspace-gen`,
            copyrightDate: new Date().getFullYear().toString(),
            dataModelVersion: socInfo.dataModelVersion,
            package: socInfo.package.toLowerCase(),
            timestamp: new Date().toISOString(),
            board: board,
            soc: soc,
            projects: [
              {
                name: "sfx",
                path: "./sfx",
              },
            ],
          };

          await genericPlugin.generateWorkspace(cfsWorkspace);

          await workspaceValidationService.validateWorkspaceFiles(
            cfsWorkspace,
            expectedWorkspaceFiles,
          );

          await workspaceValidationService.validateDirectoryStructure(
            cfsWorkspace,
            "sfx",
          );
        });
      });
    });
  });

  describe("GenerateCode_BasicFlow_ShouldGenerateExpectedFiles", () => {
    const expectedFilesByCoreId: Record<string, string[]> = {
      FX: ["src/system/soc_init.c", "src/linker/memmap.xmm"],
      CM33: ["src/system/soc_init.c", "memory.ld"],
    };

    const codeGenService = new CodeGenerationService();

    Object.entries(supportedSocs).forEach(([soc, boards]) => {
      boards.forEach((board) => {
        it(`Using ${soc} SoC with ${board} board`, async () => {
          const socInfo = pluginInfo.supportedSocs.find(
            (s) => s.name === soc && s.board === board,
          );

          if (!socInfo) {
            expect.fail(
              `No supportedSocs entry found for soc="${soc}" board="${board}"`,
            );
          }

          cfsWorkspace = {
            location:
              "tests/unit-tests/plugins/sharcfx-single-core-example/data",
            workspacePluginId: pluginInfo.pluginId,
            workspacePluginVersion: pluginInfo.pluginVersion,
            workspaceName: `${soc.toLowerCase()}-${board.toLowerCase()}-project-gen`,
            copyrightDate: new Date().getFullYear().toString(),
            dataModelVersion: socInfo.dataModelVersion,
            package: socInfo.package.toLowerCase(),
            timestamp: new Date().toISOString(),
            board: board,
            soc: soc,
            projects: [
              {
                name: "sfx",
                path: "./sfx",
              },
            ],
          };

          await genericPlugin.generateWorkspace(cfsWorkspace);

          const cfsConfigFile = joinPath(
            cfsWorkspace.location,
            cfsWorkspace.workspaceName,
            ".cfs",
            `${cfsWorkspace.soc.toLowerCase()}-${cfsWorkspace.package.toLowerCase()}.cfsconfig`,
          );
          const cfsConfig = JSON.parse(
            await fs.readFile(cfsConfigFile, "utf-8"),
          ) as CfsConfig;

          const codeGenerationPath = joinPath(
            cfsWorkspace.location,
            cfsWorkspace.workspaceName,
          );

          const socDataModel = JSON.parse(
            await fs.readFile(
              joinPath(
                "node_modules",
                "cfs-data-models",
                "socs",
                `${soc.toLowerCase()}-${cfsWorkspace.package.toLowerCase()}.json`,
              ),
              "utf-8",
            ),
          ) as CfsSocDataModel;

          const sharcFxProjects = cfsConfig.Projects.filter(
            (p: ConfiguredProject) =>
              p.PluginId === "com.analog.project.sharcfx.plugin",
          );
          const expectedCoreIds = soc.toLowerCase().includes("adsp-sc")
            ? ["CM33", "FX"]
            : ["FX"];
          expect(
            sharcFxProjects.map((project) => project.CoreId).sort(),
            "SHARC-FX core IDs in cfsconfig do not match expected",
          ).to.deep.equal(expectedCoreIds);

          for (const project of sharcFxProjects) {
            const expectedCodeGenFiles = expectedFilesByCoreId[project.CoreId];
            expect(
              expectedCodeGenFiles,
              `No expected files defined for CoreId "${project.CoreId}"`,
            ).to.not.equal(undefined);

            const projectDetails = {
              pluginId: project.PluginId,
              cfsconfig: cfsConfig,
              projectId: project.ProjectId,
              coreId: project.CoreId,
            };

            const generatedFiles = await codeGenService.runCodeGeneration(
              projectDetails,
              socDataModel,
              codeGenerationPath,
            );

            await codeGenService.validateGeneratedFiles(
              generatedFiles,
              expectedCodeGenFiles,
              joinPath(codeGenerationPath, project.PlatformConfig.ProjectName),
            );
          }
        });
      });
    });
  });
});
