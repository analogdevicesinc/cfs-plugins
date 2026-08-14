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

const filePath = "plugins/dist/msdk-single-core-aes/.cfsplugin";
const absolutePath = path.resolve(filePath);
const fileContent = await fs.readFile(absolutePath, "utf-8");
let pluginInfo = JSON.parse(fileContent) as CfsPluginInfo;
pluginInfo.pluginPath = absolutePath;

const supportedSocs = getSocsBoardsDict(pluginInfo);

describe("MSDK Single Core AES Tests", () => {
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
      "m4/.vscode/launch.json",
      "m4/.vscode/flash.gdb",
      "m4/README.md",
      ".cfs/gdb_toolbox/configs/fault-analyzer.json",
      ".cfs/gdb_toolbox/configs/memory-dump.json",
      ".cfs/gdb_toolbox/configs/register-dump.json",
      ".cfs/gdb_toolbox/configs/interrupt-status-arm.json",
      ".cfs/gdb_toolbox/configs/high-water-analyzer.json",
      ".cfs/gdb_toolbox/configs/stack-analyzer.json",
      ".cfs/gdb_toolbox/configs/stack-painter.json",
      ".cfs/gdb_toolbox/gdb/fault-analyzer-arm.gdb",
      ".cfs/gdb_toolbox/gdb/interrupt-status-arm.gdb",
      ".cfs/gdb_toolbox/gdb/high-water-analyzer.gdb",
      ".cfs/gdb_toolbox/gdb/stack-analyzer.gdb",
      ".cfs/gdb_toolbox/gdb/stack-painter.gdb",
      ".cfs/.cfsdependencies",
      ".cfs/.cfsworkspace",
      "m4/.vscode/settings.json",
      "m4/src/main.c",
      "m4/project.mk",
      "m4/Makefile",
      "m4/.vscode/c_cpp_properties.json",
      "m4/m4.jdebug",
      "m4/.vscode/cfs.tasks.json",
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
              "tests/unit-tests/plugins/msdk-single-core-aes/data",
            workspacePluginId: pluginInfo?.pluginId,
            workspacePluginVersion: pluginInfo?.pluginVersion,
            workspaceName: `${soc.toLowerCase()}-${board.toLowerCase()}-workspace-gen`,
            copyrightDate: new Date().getFullYear().toString(),
            dataModelVersion: socInfo.dataModelVersion,
            package: socInfo.package.toLowerCase(),
            timestamp: new Date().toISOString(),
            board: board,
            soc: soc,
            projects: [
              {
                name: "m4",
                path: "./m4",
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
            "m4",
          );
        });
      });
    });
  });

  describe("GenerateCode_BasicFlow_ShouldGenerateExpectedFiles", () => {
    const expectedCodeGenFiles = [
      "soc_init.c",
      "soc_init.h",
      "config.mk",
      "memory.ld",
    ];

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

          cfsWorkspace = {
            location:
              "tests/unit-tests/plugins/msdk-single-core-aes/data",
            workspacePluginId: pluginInfo?.pluginId,
            workspacePluginVersion: pluginInfo?.pluginVersion,
            workspaceName: `${soc.toLowerCase()}-${board.toLowerCase()}-project-gen`,
            copyrightDate: new Date().getFullYear().toString(),
            dataModelVersion: socInfo.dataModelVersion,
            package: socInfo.package,
            timestamp: new Date().toISOString(),
            board: board,
            soc: soc,
            projects: [
              {
                name: "m4",
                path: "./m4",
              },
            ],
          };

          await genericPlugin.generateWorkspace(cfsWorkspace);

          const actualcfsConfigFile = joinPath(
            cfsWorkspace.location,
            cfsWorkspace.workspaceName,
            ".cfs",
            `${cfsWorkspace.soc.toLowerCase()}-${cfsWorkspace.package.toLowerCase()}.cfsconfig`,
          );
          const actualcfsConfigContent = JSON.parse(
            await fs.readFile(actualcfsConfigFile, "utf-8"),
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

          const project = actualcfsConfigContent.Projects.find(
            (p: any) => p.PluginId === "com.analog.project.msdk.plugin",
          );

          if (!project) {
            expect.fail(
              `No project found in cfsconfig with PluginId: com.analog.project.msdk.plugin`,
            );
          }

          const projectDetails = {
            pluginId: "com.analog.project.msdk.plugin",
            cfsconfig: actualcfsConfigContent,
            projectId: project.ProjectId,
            coreId: project.CoreId,
          };

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
            projectDetails,
            socDataModel,
            codeGenerationPath,
          );

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
