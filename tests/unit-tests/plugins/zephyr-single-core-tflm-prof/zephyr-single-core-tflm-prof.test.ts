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
import type { CfsPluginInfo } from "cfs-types";
import { CodeGenerationService } from "@services/CodeGenerationService.js";
import { fileExists, isDebug } from "@utilities/test-utilities.js";
import { joinPath } from "@utilities/path-utilities.js";
import {
  validateJsonFile,
  findJsonFiles,
} from "@utilities/validate-json.js";

describe("Unit test for Zephyr Single Core TFLM Prof", () => {
  let plugin: GenericPlugin;
  let pluginInfo: CfsPluginInfo;
  const cfsWorkspace = {
    location: "tests/unit-tests/plugins/zephyr-single-core-tflm-prof/data",
    workspacePluginId: "test-plugin-id",
    workspacePluginVersion: "1.0.0",
    workspaceName: "max32690-workspace",
    coreArchitecture: "m4",
    copyrightDate: new Date().getFullYear().toString(),
    dataModelVersion: "1.0.0",
    dataModelSchemaVersion: "1.0.0",
    package: "tqfn",
    timestamp: new Date().toISOString(),
    board: "evkit_v1",
    soc: "max32690",
    projects: [
      {
        name: "m4",
        path: "./m4",
      },
    ],
  };

  before(async () => {
    try {
      const filePath = "plugins/dist/zephyr-single-core-tflm-prof/.cfsplugin";
      const absolutePath = path.resolve(filePath);
      const fileContent = await fs.readFile(absolutePath, "utf-8");
      pluginInfo = JSON.parse(fileContent) as CfsPluginInfo;
      pluginInfo.pluginPath = absolutePath;
    } catch (error) {
      expect.fail(`${error}`);
    }
  });

  beforeEach(() => {
    plugin = new GenericPlugin(pluginInfo);
  });

  afterEach(async () => {
    if (!isDebug()) {
      await fs.rm(cfsWorkspace.location, { recursive: true, force: true });
    }
  });

  it("Should generate a workspace", async () => {
    await plugin.generateWorkspace(cfsWorkspace).catch((error) => {
      expect.fail(`${error}`);
    });

    // Verify the generated project files.
    const expectedFiles = [
      ".cfs/max32690-tqfn.cfsconfig",
      ".cfs/ai.cfsaiprof",
      "m4/.vscode/settings.json",
      "m4/src/adi_tflm/adi_tflm.hpp",
      "m4/src/adi_tflm/model.cpp",
      "m4/src/adi_tflm/model.hpp",
      "m4/dataset.bin",
      "m4/model.tflite",
    ];

    for (const file of expectedFiles) {
      const filePath = joinPath(
        cfsWorkspace.location,
        cfsWorkspace.workspaceName,
        file,
      );
      const fileExistsInProject = await fileExists(filePath);
      expect(
        fileExistsInProject,
        `File ${file} should exist in the project directory`,
      ).to.be.true;
    }

    // Confirm that valid JSON files were generated.
    const jsonFiles = await findJsonFiles(cfsWorkspace.location);
    expect(jsonFiles.length).to.be.greaterThan(0, "No JSON files found");
    for (const file of jsonFiles) {
      const result = await validateJsonFile(file);
      expect(result, `Error: '${file}' is not a valid JSON file.`).to.be.true;
    }
  });

  it("should generate code with expected files including aimodels.cmake", async () => {
    await plugin.generateWorkspace(cfsWorkspace).catch((error) => {
      expect.fail(`${error}`);
    });

    const actualCfsConfigFile = joinPath(
      cfsWorkspace.location,
      cfsWorkspace.workspaceName,
      ".cfs",
      `${cfsWorkspace.soc}-${cfsWorkspace.package}.cfsconfig`,
    );
    const cfsConfig = JSON.parse(
      await fs.readFile(actualCfsConfigFile, "utf-8"),
    );

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
      `${cfsWorkspace.soc}-${cfsWorkspace.package}.json`,
    );
    const socDataModel = JSON.parse(
      await fs.readFile(socDataModelPath, "utf-8"),
    );

    const codeGenerationPath = joinPath(
      cfsWorkspace.location,
      cfsWorkspace.workspaceName,
    );
    const codeGenService = new CodeGenerationService();

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
