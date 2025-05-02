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
import sinon from "sinon";
import { expect } from "chai";
import Plugin from "../../../../plugins/msdk-single-core-hello-world/index.js";
import type { CfsPluginInfo, CfsWorkspaceGenerator } from "cfs-plugins-api";
import { CfsFeatureScope } from "cfs-plugins-api";
import { isDebug } from "../../utilities/test-utilities.js";

describe("Unit test for MSDK Single Core Hello World", () => {
  let plugin: Plugin;
  let pluginInfo: CfsPluginInfo;
  const cfsWorkspace = {
    location: "tests/unit-tests/plugins/msdk-single-core-hello-world/data",
    workspacePluginId: "test-plugin-id",
    workspacePluginVersion: "1.0.0",
    workspaceName: "max32655-workspace",
    copyrightDate: new Date().getFullYear().toString(),
    dataModelVersion: "1.0.0",
    dataModelSchemaVersion: "1.0.0",
    package: "ctbga",
    timestamp: new Date().toISOString(),
    board: "evkit_v1",
    soc: "max32655",
    projects: [
      {
        name: "m4",
        path: "./m4",
      },
    ],
  };

  before(async () => {
    try {
      const filePath = "plugins/msdk-single-core-hello-world/.cfsplugin";
      const absolutePath = path.resolve(filePath);
      const fileContent = await fs.readFile(absolutePath, "utf-8");
      pluginInfo = JSON.parse(fileContent) as CfsPluginInfo;
      pluginInfo.pluginPath = absolutePath;
    } catch (error) {
      expect.fail(`${error}`);
    }
  });

  beforeEach(() => {
    plugin = new Plugin(pluginInfo, cfsWorkspace);
  });

  afterEach(async () => {
    if (!isDebug()) {
      await fs.rm(cfsWorkspace.location, { recursive: true, force: true });
    }
  });

  it("Should return an empty array for getEnvironmentVariables", () => {
    const result = plugin.getEnvironmentVariables();
    expect(result).to.be.an("array");
    expect(result).to.have.lengthOf(0);
  });

  it("Should get a workspace generator", () => {
    const getGeneratorSpy = sinon.spy(plugin, "getGenerator");
    const workspaceGenerator: CfsWorkspaceGenerator = plugin.getGenerator(
      CfsFeatureScope.Workspace
    );

    expect(workspaceGenerator).to.be.an("object");
    expect(workspaceGenerator.generateWorkspace).to.be.a("function");
    expect(getGeneratorSpy.calledWith(CfsFeatureScope.Workspace)).to.be.true;
    expect(getGeneratorSpy.called).to.be.true;
    getGeneratorSpy.restore();
  });

  it("Should generate a workspace", async () => {
    const workspaceGenerator: CfsWorkspaceGenerator = plugin.getGenerator(
      CfsFeatureScope.Workspace
    );
    await workspaceGenerator.generateWorkspace(cfsWorkspace).catch((error) => {
      expect.fail(`${error}`);
    });
  });

  it("Should return empty array if scope is not found on properties", () => {
    const getPropertiesSpy = sinon.spy(plugin, "getProperties");
    const properties = plugin.getProperties(CfsFeatureScope.Memory);
    expect(getPropertiesSpy.called).to.be.true;
    expect(Array.isArray(properties)).to.be.true;
    expect(properties.length).to.equal(0);
    getPropertiesSpy.restore();
  });
});
