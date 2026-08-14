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
import type { CfsPluginInfo, CfsWorkspace } from "cfs-types";
import { WorkspaceValidationService } from "@services/WorkspaceValidationService.js";
import { CodeGenerationService } from "@services/CodeGenerationService.js";
import { joinPath } from "@utilities/path-utilities.js";
import {
  deleteCreatedWorkspace,
  getSocsBoardsDict,
  isDebug,
  replaceTemplateVariables,
} from "@utilities/test-utilities.js";

const filePath = "plugins/dist/zephyr-single-core-tflm/.cfsplugin";
const absolutePath = path.resolve(filePath);
const fileContent = await fs.readFile(absolutePath, "utf-8");
const pluginInfo = JSON.parse(fileContent) as CfsPluginInfo;
pluginInfo.pluginPath = absolutePath;

const supportedSocs = getSocsBoardsDict(pluginInfo);

// MAX32657/MAX32658 generate onto the m33 core; every other supported SoC
// uses m4 (see plugins/zephyr-single-core-tflm/.cfsplugin dst expressions).
const getCoreDir = (soc: string): string =>
  ["max32657", "max32658"].includes(soc.toLowerCase()) ? "m33" : "m4";

describe("Unit test for Zephyr Single Core TFLM", () => {
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
      "{{core}}/.vscode/c_cpp_properties.json",
      "{{core}}/src/main.cpp",
      "{{core}}/src/adi_tflm/adi_tflm.hpp",
      "{{core}}/src/adi_tflm/hello_world_model_f32.cpp",
      "{{core}}/src/adi_tflm/hello_world_model_f32.hpp",
      "{{core}}/CMakeLists.txt",
      "{{core}}/README.rst",
      "{{core}}/hello_world_f32.tflite",
      "{{core}}/.vscode/settings.json",
      "{{core}}/prj.conf",
      "{{core}}/.vscode/launch.json",
      "{{core}}/{{core}}.jdebug",
      ".cfs/gdb_toolbox/configs/fault-analyzer.json",
      ".cfs/gdb_toolbox/configs/memory-dump.json",
      ".cfs/gdb_toolbox/configs/register-dump.json",
      ".cfs/gdb_toolbox/configs/crash-cause-zephyr.json",
      ".cfs/gdb_toolbox/configs/thread-analyzer.json",
      ".cfs/gdb_toolbox/configs/heap-analyzer.json",
      ".cfs/gdb_toolbox/gdb/fault-analyzer-arm.gdb",
      ".cfs/gdb_toolbox/gdb/heap-analyzer.gdb",
      ".cfs/gdb_toolbox/gdb/crash-cause-zephyr.gdb",
      ".cfs/gdb_toolbox/gdb/thread-analyzer.gdb",
      ".cfs/.cfsdependencies",
      ".cfs/.cfsworkspace",
      "{{soc}}-{{board}}-workspace-gen.code-workspace",
      ".cfs/{{soc}}-{{package}}.cfsconfig",
    ];

    const workspaceValidationService = new WorkspaceValidationService();

    Object.entries(supportedSocs).forEach(([soc, boards]) => {
      boards.forEach((board) => {
        it(`For ${soc} soc with ${board} board`, async () => {
          const socInfo = pluginInfo.supportedSocs.find(
            (s) => s.name === soc && s.board === board,
          );

          if (!socInfo) {
            expect.fail(
              `No supportedSocs entry found for soc="${soc}" board="${board}"`,
            );
          }

          const coreDir = getCoreDir(soc);
          const expectedWorkspaceFiles = expectedWorkspaceFilesBase.map(
            (file) =>
              replaceTemplateVariables(file, {
                soc: soc.toLowerCase(),
                board: board.toLowerCase(),
                package: socInfo.package.toLowerCase(),
                core: coreDir,
              }),
          );

          cfsWorkspace = {
            location: "tests/unit-tests/plugins/zephyr-single-core-tflm/data",
            workspacePluginId: pluginInfo.pluginId,
            workspacePluginVersion: pluginInfo.pluginVersion,
            workspaceName: `${soc.toLowerCase()}-${board.toLowerCase()}-workspace-gen`,
            copyrightDate: new Date().getFullYear().toString(),
            dataModelVersion: socInfo.dataModelVersion,
            package: socInfo.package.toLowerCase(),
            timestamp: new Date().toISOString(),
            board: board,
            soc: soc,
            projects: [{ name: coreDir, path: `./${coreDir}` }],
          };

          await genericPlugin.generateWorkspace(cfsWorkspace);

          await workspaceValidationService.validateWorkspaceFiles(
            cfsWorkspace,
            expectedWorkspaceFiles,
          );

          await workspaceValidationService.validateDirectoryStructure(
            cfsWorkspace,
            coreDir,
          );
        });
      });
    });
  });

  describe("GenerateCode_BasicFlow_ShouldGenerateExpectedFiles", () => {
    Object.entries(supportedSocs).forEach(([soc, boards]) => {
      boards.forEach((board) => {
        it(`For ${soc} with ${board} board`, async () => {
          const socInfo = pluginInfo.supportedSocs.find(
            (s) => s.name === soc && s.board === board,
          );

          if (!socInfo) {
            expect.fail(
              `No supportedSocs entry found for soc="${soc}" board="${board}"`,
            );
          }

          const coreDir = getCoreDir(soc);

          cfsWorkspace = {
            location: "tests/unit-tests/plugins/zephyr-single-core-tflm/data",
            workspacePluginId: pluginInfo.pluginId,
            workspacePluginVersion: pluginInfo.pluginVersion,
            workspaceName: `${soc.toLowerCase()}-${board.toLowerCase()}-project-gen`,
            copyrightDate: new Date().getFullYear().toString(),
            dataModelVersion: socInfo.dataModelVersion,
            package: socInfo.package,
            timestamp: new Date().toISOString(),
            board: board,
            soc: soc,
            projects: [{ name: coreDir, path: `./${coreDir}` }],
          };

          await genericPlugin.generateWorkspace(cfsWorkspace);

          const actualCfsConfigFile = joinPath(
            cfsWorkspace.location,
            cfsWorkspace.workspaceName,
            ".cfs",
            `${cfsWorkspace.soc.toLowerCase()}-${cfsWorkspace.package.toLowerCase()}.cfsconfig`,
          );
          const cfsConfig = JSON.parse(
            await fs.readFile(actualCfsConfigFile, "utf-8"),
          );

          const codeGenerationPath = joinPath(
            cfsWorkspace.location,
            cfsWorkspace.workspaceName,
          );
          const codeGenService = new CodeGenerationService();

          if (!cfsWorkspace.projects) {
            expect.fail(
              "No projects found in workspace - cannot validate generated files",
            );
          }

          const project = cfsConfig.Projects.find(
            (p: any) => p.PluginId === "com.analog.project.zephyr.plugin",
          );

          if (!project) {
            expect.fail("No matching project found in cfsconfig");
          }

          const socDataModelPath = joinPath(
            "node_modules",
            "cfs-data-models",
            "socs",
            `${soc.toLowerCase()}-${cfsWorkspace.package.toLowerCase()}.json`,
          );
          const socDataModel = JSON.parse(
            await fs.readFile(socDataModelPath, "utf-8"),
          );

          const generatedFiles = await codeGenService.runCodeGeneration(
            {
              pluginId: project.PluginId,
              cfsconfig: cfsConfig,
              projectId: project.ProjectId,
              coreId: project.CoreId,
            },
            socDataModel,
            codeGenerationPath,
          );

          // This template ships an AIModels entry for every supported SoC, so
          // aimodels.cmake must be generated alongside the board conf/overlay
          // files - a regression here would previously go undetected.
          const boardFileStem: string =
            project.PlatformConfig.ZephyrBoardName.split("/").join("_");
          const expectedCodeGenFiles = [
            `boards/${boardFileStem}.conf`,
            `boards/${boardFileStem}.overlay`,
            "aimodels.cmake",
          ];

          await codeGenService.validateGeneratedFiles(
            generatedFiles,
            expectedCodeGenFiles,
            joinPath(codeGenerationPath, cfsWorkspace.projects[0].name),
          );
        });
      });
    });
  });
});
