/**
 *
 * Copyright (c) 2025 Analog Devices, Inc.
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
import { GenericPlugin } from "../../../../api/src/generic/cfs-generic-plugin.js";
import type { CfsPluginInfo } from "cfs-plugins-api";
import { fileExists, isDebug } from "../../utilities/test-utilities.js";
import { joinPath } from "../../utilities/path-utilities.js";
import {
  validateJsonFile,
  findJsonFiles,
} from "../../utilities/validate-json.js";

describe("Unit test for Zephyr Single Core Hello Cpp World", () => {
  let plugin: GenericPlugin;
  let pluginInfo: CfsPluginInfo;
  const cfsWorkspace = {
    location:
      "tests/unit-tests/plugins/zephyr-single-core-hello-cpp-world/data",
    workspacePluginId: "test-plugin-id",
    workspacePluginVersion: "1.0.0",
    workspaceName: "max32690-workspace",
    coreArchitecture: "m4",
    copyrightDate: new Date().getFullYear().toString(),
    dataModelVersion: "1.0.0",
    dataModelSchemaVersion: "1.0.0",
    package: "wlp",
    timestamp: new Date().toISOString(),
    board: "fthr",
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
      const filePath = "plugins/zephyr-single-core-hello-cpp-world/.cfsplugin";
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

    // Verify the generated project files
    const expectedFiles = [
      ".cfs/max32690-wlp.cfsconfig",
      "m4/.vscode/settings.json",
    ];

    for (const file of expectedFiles) {
      const filePath = joinPath(
        cfsWorkspace.location,
        cfsWorkspace.workspaceName,
        file
      );
      const fileExistsInProject = await fileExists(filePath);
      expect(
        fileExistsInProject,
        `File ${file} should exist in the project directory`
      ).to.be.true;
    }

    // Confirm that valid JSON files were generated
    const jsonFiles = await findJsonFiles(cfsWorkspace.location);
    expect(jsonFiles.length).to.be.greaterThan(0, "No JSON files found");
    for (const file of jsonFiles) {
      const result = await validateJsonFile(file);
      expect(result, `Error: '${file}' is not a valid JSON file.`).to.be.true;
    }
  });
});
