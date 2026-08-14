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

const filePath = "plugins/dist/zephyr-tfm-secure-partition/.cfsplugin";
const absolutePath = path.resolve(filePath);
const fileContent = await fs.readFile(absolutePath, "utf-8");
let pluginInfo = JSON.parse(fileContent) as CfsPluginInfo;
pluginInfo.pluginPath = absolutePath;

const mcubootImgtoolPathProperty = pluginInfo.properties.workspace.find(
  (prop) => prop.id === "MCUbootImgtoolPath",
);
//zephyr-project-plugin service and plugin info setup
const supportedSocs = getSocsBoardsDict(pluginInfo);

describe("Zephyr TFM Secure Partition Tests", () => {
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
    const expectedWorkspacesFilesBase = [
      "m33/.vscode/launch.json",
      "m33/.vscode/c_cpp_properties.json",
      "m33/src/main.c",
      "m33/src/dummy_partition.c",
      "m33/dummy_partition/CMakeLists.txt",
      "m33/dummy_partition/dummy_partition.c",
      "m33/dummy_partition/tfm_dummy_partition.yaml",
      "m33/dummy_partition/tfm_manifest_list.yaml.in",
      "m33/src/dummy_partition.h",
      "m33/CMakeLists.txt",
      "m33/prj.conf",
      "m33/README.rst",
      ".cfs/gdb_toolbox/configs/fault-analyzer.json",
      ".cfs/gdb_toolbox/configs/memory-dump.json",
      ".cfs/gdb_toolbox/configs/register-dump.json",
      ".cfs/gdb_toolbox/configs/thread-analyzer.json",
      ".cfs/gdb_toolbox/configs/crash-cause-zephyr.json",
      ".cfs/gdb_toolbox/gdb/fault-analyzer-arm.gdb",
      ".cfs/gdb_toolbox/gdb/thread-analyzer.gdb",
      ".cfs/gdb_toolbox/gdb/crash-cause-zephyr.gdb",
      ".cfs/.cfsdependencies",
      ".cfs/.cfsworkspace",
      "m33/.vscode/settings.json",
      "m33/.vscode/tasks.json",
      "m33/m33.jdebug",
      "{{soc}}-{{board}}-workspace-gen.code-workspace",
      ".cfs/{{soc}}-{{package}}.cfsconfig",
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

          const expectedWorkspaceFiles = expectedWorkspacesFilesBase.map(
            (file) =>
              replaceTemplateVariables(file, {
                soc: soc.toLowerCase(),
                board: board.toLowerCase(),
                package: socInfo.package.toLowerCase(),
              }),
          );

          cfsWorkspace = {
            location:
              "tests/unit-tests/plugins/zephyr-tfm-secure-partition/data",
            workspacePluginId: pluginInfo?.pluginId,
            workspacePluginVersion: pluginInfo?.pluginVersion,
            workspaceName: `${soc.toLowerCase()}-${board.toLowerCase()}-workspace-gen`,
            copyrightDate: new Date().getFullYear().toString(),
            dataModelVersion: socInfo.dataModelVersion,
            package: socInfo.package.toLowerCase(),
            timestamp: new Date().toISOString(),
            board: board,
            soc: soc,
            MCUbootImgtoolPath: mcubootImgtoolPathProperty?.default || "",
            MCUbootKeyType: "rsa-3072",
            projects: [
              {
                name: "m33",
                path: "./m33",
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
            "m33",
          );
        });
      });
    });
  });

  describe("GenerateCode_BasicFlow_ShouldGenerateExpectedFiles", () => {
    const expectedFilesByProjectId = [
      {
        projectId: "CM33 Secure",
        pluginId: "com.analog.project.msdk.plugin",
        files: [
          "adi_soc_peripheral_init.c",
          "adi_soc_peripheral_init.h",
          "s_ns_access_overlay.cmake",
        ],
      },
      {
        projectId: "CM33 Non-Secure",
        pluginId: "com.analog.project.zephyr.plugin",
        files: [
          "boards/{{soc}}evkit_{{soc}}_ns.conf",
          "boards/{{soc}}evkit_{{soc}}_ns.overlay",
        ],
      },
    ];

    Object.entries(supportedSocs).forEach(([soc, boards]) => {
      boards.forEach((board) => {
        it(`Using ${soc} SoC with ${board} board`, async () => {
          const socInfo = pluginInfo.supportedSocs.find(
            (s) => s.name === soc && s.board === board,
          );

          cfsWorkspace = {
            location:
              "tests/unit-tests/plugins/zephyr-tfm-secure-partition/data",
            workspacePluginId: pluginInfo?.pluginId,
            workspacePluginVersion: pluginInfo?.pluginVersion,
            workspaceName: `${soc.toLowerCase()}-${board.toLowerCase()}-project-gen`,
            copyrightDate: new Date().getFullYear().toString(),
            dataModelVersion: socInfo.dataModelVersion,
            package: socInfo.package,
            timestamp: new Date().toISOString(),
            board: board,
            soc: soc,
            MCUbootImgtoolPath: mcubootImgtoolPathProperty?.default || "",
            MCUbootKeyType: "rsa-3072",
            projects: [
              {
                name: "m33",
                path: "./m33",
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

          for (const {
            projectId,
            pluginId,
            files,
          } of expectedFilesByProjectId) {
            const project = actualcfsConfigContent.Projects.find(
              (p: any) => p.ProjectId === projectId && p.PluginId === pluginId,
            );

            if (!project) {
              expect.fail(
                `No project found in cfsconfig with ProjectId: ${projectId} and PluginId: ${pluginId}`,
              );
            }

            const projectDetails = {
              pluginId,
              cfsconfig: actualcfsConfigContent,
              projectId: project.ProjectId,
              coreId: project.CoreId,
            };

            // Load SOC data model
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
              files.map((file) =>
                replaceTemplateVariables(file, { soc: soc.toLowerCase() }),
              ),
              joinPath(codeGenerationPath, cfsWorkspace.projects[0].name),
            );
          }
        });
      });
    });
  });
});
