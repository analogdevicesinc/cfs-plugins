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
  CfsPluginInfo,
  CfsWorkspace,
  CfsSocDataModel,
} from "cfs-types";
import { WorkspaceGenerationService } from "@services/WorkspaceGenerationService.js";
import { WorkspaceValidationService } from "@services/WorkspaceValidationService.js";
import { CodeGenerationService } from "@services/CodeGenerationService.js";
import { joinPath } from "@utilities/path-utilities.js";

describe("MAX32657 Zephyr TFM Secure Partition Tests", () => {
  let genericPlugin: GenericPlugin;
  let pluginInfo: CfsPluginInfo;
  let socDataModel: CfsSocDataModel;

  before(async () => {
    // Load SOC data model
    const socDataModelPath = path.resolve(
      "node_modules/cfs-data-models/socs/max32657-wlp.json",
    );
    socDataModel = JSON.parse(await fs.readFile(socDataModelPath, "utf-8"));

    try {
      //workspace generation service and plugin info setup
      const filePath = "plugins/dist/zephyr-tfm-secure-partition/.cfsplugin";
      const absolutePath = path.resolve(filePath);
      const fileContent = await fs.readFile(absolutePath, "utf-8");
      pluginInfo = JSON.parse(fileContent) as CfsPluginInfo;
      pluginInfo.pluginPath = absolutePath;
      //zephyr-project-plugin service and plugin info setup
    } catch (error) {
      expect.fail(`${error}`);
    }
  });

  beforeEach(() => {
    genericPlugin = new GenericPlugin(pluginInfo);
  });

  //Positive tests
  it("GenerateWorkspace_BasicFlow_ShouldGenerateExpectedFiles", async () => {
    const workspaceGenService = new WorkspaceGenerationService(pluginInfo);
    const expectedWorkspaceFiles = [
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
      "m33/sample.yaml",
      ".cfs/gdb_toolbox/configs/fault-analyzer.json",
      ".cfs/gdb_toolbox/configs/memory-dump.json",
      ".cfs/gdb_toolbox/configs/register-dump.json",
      ".cfs/gdb_toolbox/configs/thread-analyzer.json",
      ".cfs/gdb_toolbox/configs/crash-cause-zephyr.json",
      ".cfs/gdb_toolbox/gdb/fault-analyzer-arm.gdb",
      ".cfs/gdb_toolbox/gdb/thread-analyzer.gdb",
      ".cfs/gdb_toolbox/gdb/crash-cause-zephyr.gdb",
      ".cfs/max32657-wlp.cfsconfig",
      ".cfs/.cfsdependencies",
      ".cfs/.cfsworkspace",
      "m33/.vscode/settings.json",
      "m33/.vscode/tasks.json",
      "m33/m33.jdebug",
      "max32657-workspace.code-workspace",
    ];
    const cfsWorkspaceList = await workspaceGenService.createCfsWorkspaceList(
      "max32657",
      "rsa-3072",
      [
        {
          name: "m33",
          path: "./m33",
        },
      ],
      "tests/unit-tests/plugins/zephyr-tfm-secure-partition/data"
    );
    const workspaceValidationService = new WorkspaceValidationService();
    const errorList = [];
    for(const cfsWorkspace of cfsWorkspaceList) {
      try {
        await genericPlugin.generateWorkspace(cfsWorkspace);
        await workspaceValidationService.validateWorkspaceFiles(
          cfsWorkspace,
          expectedWorkspaceFiles,
        );

        await workspaceValidationService.validateDirectoryStructure(
          cfsWorkspace,
          "m33",
        ); 
      } catch (error) {
        errorList.push(error);
      } finally {
        await deleteCreatedWorkspace(cfsWorkspace);
      }
    }
    if (errorList.length > 0) {
      expect.fail(`Errors occurred during workspace generation: ${errorList.map(e => e.message).join("\n ")}`);
    }
  });

  it("GenerateCode_BasicFlow_ShouldGenerateExpectedFiles", async () => {
    // First generate the workspace
    const workspaceGenService = new WorkspaceGenerationService(pluginInfo);
    const cfsWorkspaceList = await workspaceGenService.createCfsWorkspaceList(
      "max32657",
      "rsa-3072",
      [
        {
          name: "m33",
          path: "./m33",
        },
      ],
      "tests/unit-tests/plugins/zephyr-tfm-secure-partition/data",
    );

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
          "boards/max32657evkit_max32657_ns.conf",
          "boards/max32657evkit_max32657_ns.overlay",
        ],
      },
    ];

    const errorList = [];
    for (const cfsWorkspace of cfsWorkspaceList) {
      try {
        await genericPlugin.generateWorkspace(cfsWorkspace);

        const actualcfsConfigFile = joinPath(
          cfsWorkspace.location,
          cfsWorkspace.workspaceName,
          ".cfs",
          `${cfsWorkspace.soc}-${cfsWorkspace.package}.cfsconfig`,
        );
        const actualcfsConfigContent = await JSON.parse(
          await fs.readFile(actualcfsConfigFile, "utf-8"),
        );

        const codeGenerationPath = cfsWorkspace.location;
        const codeGenService = new CodeGenerationService();

        if (!cfsWorkspace.projects) {
          expect.fail(
            "No projects found in workspace - cannot validate generated files",
          );
        }

        for (const { projectId, pluginId, files } of expectedFilesByProjectId) {
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

          const generatedFiles = await codeGenService.runCodeGeneration(
            projectDetails,
            socDataModel,
            codeGenerationPath,
          );

          await codeGenService.validateGeneratedFiles(
            generatedFiles,
            files,
            `${codeGenerationPath}/${cfsWorkspace.projects[0].name}`,
          );
        }
      } catch (error) {
        errorList.push(error);
      } finally {
        await deleteCreatedWorkspace(cfsWorkspace);
      }
    }
    if (errorList.length > 0) {
      expect.fail(`Errors occurred during code generation: ${errorList.map(e => e.message).join("\n ")}`);
    }
  });
});

async function deleteCreatedWorkspace(cfsWorkspace: CfsWorkspace) {
  await fs.rm(cfsWorkspace.location, {
    recursive: true,
    force: true,
    maxRetries: 8,
    retryDelay: 150,
  });
}

