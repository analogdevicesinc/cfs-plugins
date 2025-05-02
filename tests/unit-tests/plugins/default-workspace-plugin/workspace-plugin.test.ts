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
import { CfsFeatureScope, CfsPluginInfo } from "cfs-plugins-api";
import { CfsEtaWorkspaceGenerator } from "../../../../plugins/common/generators/eta/cfs-eta-workspace-generator.js";
import WorkspacePlugin from "../../../../plugins/default-workspace-plugin/index.js";
import { fileExists, isDebug } from "../../utilities/test-utilities.js";

describe("Unit test for WorkspacePlugin", () => {
  let plugin: WorkspacePlugin;
  let pluginInfo: CfsPluginInfo;
  let cfsFeatureScope: CfsFeatureScope;

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
      cfsFeatureScope = CfsFeatureScope.Workspace;
    } catch (error) {
      expect.fail(`${error}`);
    }
  });

  beforeEach(() => {
    plugin = new WorkspacePlugin(pluginInfo, cfsWorkspace);
  });

  afterEach(async () => {
    if (!isDebug()) {
      await fs.rm(cfsWorkspace.location, { recursive: true, force: true });
    }
  });

  it("Should return CfsEtaWorkspaceGenerator from getGenerators", () => {
    const generators = [
      plugin.getGenerator<CfsEtaWorkspaceGenerator>(cfsFeatureScope),
    ];
    expect(generators).to.be.an("array").that.is.not.empty;
    expect(generators[0]).to.be.instanceOf(CfsEtaWorkspaceGenerator);
  });

  it("Should generate the workspace", async () => {
    const generator =
      plugin.getGenerator<CfsEtaWorkspaceGenerator>(cfsFeatureScope);
    await generator.generateWorkspace(cfsWorkspace);

    // Verify the workspace was generated
    const paths = {
      cfsWorkspace: path.join(
        `${cfsWorkspace.location}/${cfsWorkspace.workspaceName}/.cfs/`,
        `.cfsworkspace`,
      ),
      codeWorkspace: path.join(
        `${cfsWorkspace.location}/${cfsWorkspace.workspaceName}`,
        `${cfsWorkspace.workspaceName}.code-workspace`,
      ),
      cfsConfig: path.join(
        `${cfsWorkspace.location}/${cfsWorkspace.workspaceName}/.cfs/`,
        `${cfsWorkspace.workspaceName}.cfsconfig`,
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
  });
});
