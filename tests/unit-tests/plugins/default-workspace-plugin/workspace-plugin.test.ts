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
import { CfsPluginInfo } from "cfs-plugins-api";
import { GenericPlugin } from "../../../../api/src/generic/cfs-generic-plugin.js";
import { fileExists, isDebug } from "../../utilities/test-utilities.js";
import { joinPath } from "../../utilities/path-utilities.js";
import {
  validateJsonFile,
  findJsonFiles,
} from "../../utilities/validate-json.js";

describe("Unit test for WorkspacePlugin", () => {
  let plugin: GenericPlugin;
  let pluginInfo: CfsPluginInfo;

  const cfsWorkspace = {
    location: "tests/unit-tests/plugins/data",
    workspacePluginId: "com.analog.workspace.default.plugin",
    workspacePluginVersion: "1.0.0",
    workspaceName: "test-workspace",
    copyrightDate: new Date().getFullYear().toString(),
    dataModelVersion: "1.0.0",
    dataModelSchemaVersion: "1.0.0",
    package: "test-package",
    timestamp: new Date().toISOString(),
    board: "test-board",
    soc: "MAX32690",
    projects: [
      {
        name: "m4",
        path: "./m4",
        platformConfig: { ProjectName: "m4" },
      },
      {
        name: "riscv",
        path: "./riscv",
        platformConfig: { ProjectName: "riscv" },
      },
    ],
  };

  before(async () => {
    try {
      const filePath = "plugins/default-workspace-plugin/.cfsplugin";
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

  it("Should generate the workspace", async () => {
    await plugin.generateWorkspace(cfsWorkspace);

    // Verify the workspace was generated
    const paths = {
      cfsWorkspace: joinPath(
        `${cfsWorkspace.location}/${cfsWorkspace.workspaceName}/.cfs/`,
        `.cfsworkspace`
      ),
      codeWorkspace: joinPath(
        `${cfsWorkspace.location}/${cfsWorkspace.workspaceName}`,
        `${cfsWorkspace.workspaceName}.code-workspace`
      ),
      cfsConfig: joinPath(
        `${cfsWorkspace.location}/${cfsWorkspace.workspaceName}/.cfs/`,
        `${cfsWorkspace.workspaceName}.cfsconfig`
      ),
    };

    const cfsWorkspaceExists = await fileExists(paths.cfsWorkspace);
    expect(cfsWorkspaceExists, `Expected ${paths.cfsWorkspace} to exist`).to.be
      .true;

    const codeWorkspaceExists = await fileExists(paths.codeWorkspace);
    expect(codeWorkspaceExists, `Expected ${paths.codeWorkspace} to exist`).to
      .be.true;

    const cfsConfigExists = await fileExists(paths.cfsConfig);
    expect(cfsConfigExists, `Expected ${paths.cfsConfig} to exist`).to.be.true;

    // currently broken - gdb toolbox json configs are only accessible via dist which the tests don't have access to

    // Confirm that valid JSON files were generated
    // const jsonFiles = await findJsonFiles(cfsWorkspace.location);
    // expect(jsonFiles.length).to.be.greaterThan(0, "No JSON files found");
    // for (const file of jsonFiles) {
    //   const result = await validateJsonFile(file);
    //   expect(result, `Error: '${file}' is not a valid JSON file.`).to.be.true;
    // }
  });
});
