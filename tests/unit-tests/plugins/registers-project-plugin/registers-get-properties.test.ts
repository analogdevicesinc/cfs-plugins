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

import path from "node:path";
import fs from "node:fs";
import {
  CfsFeatureScope,
  CfsPluginInfo,
  CfsProject,
  CfsPluginProperty,
} from "cfs-plugins-api";
import RegistersProjectPlugin from "../../../../plugins/registers-project-plugin/index.js";
import { expect } from "chai";

describe("getProperties method for baremetal project plugin", () => {
  let projectPlugin: RegistersProjectPlugin;
  let projectPluginInfo: CfsPluginInfo;

  const cfsProject: CfsProject = {
    id: "test-project-id",
    coreId: "the-core-id",
    package: "test-package",
    board: "test-board",
    soc: "test-soc",
    name: "test-project",
    path: "tests/unit-tests/plugins/zephyr41-project-plugin/data/test-workspace",
    pluginId: "test-plugin-id",
    pluginVersion: "1.0.0",
    platformConfig: {
      ProjectName: "m4",
      ZephyrBoardName: "apard32690/max32690/m4",
      CMakeArgs: "",
    },
  };

  before(async () => {
    try {
      const registersCfsPlugin = "plugins/registers-project-plugin/.cfsplugin";
      const absolutePath = path.resolve(registersCfsPlugin);
      const cfsPluginInfo = await fs.promises.readFile(absolutePath, "utf-8");
      projectPluginInfo = JSON.parse(cfsPluginInfo) as CfsPluginInfo;
      projectPluginInfo.pluginPath = absolutePath;
    } catch (error) {
      expect.fail(`${error}`);
    }
  });

  beforeEach(() => {
    projectPlugin = new RegistersProjectPlugin(projectPluginInfo, cfsProject);
  });

  /* Temporarily disabling this test until the feature is fully implemented */
  /*
  describe("getProperties", () => {
    it("should replace dynamic values with values from this.context when getting properties", () => {
      const properties = projectPlugin.getProperties(
        CfsFeatureScope.Project,
      ) as CfsPluginProperty[];

      if (
        Array.isArray(projectPluginInfo.properties?.[CfsFeatureScope.Project])
      ) {
        expect(Array.isArray(properties)).to.be.true;
        expect(properties.length).to.equal(
          projectPluginInfo.properties[CfsFeatureScope.Project].length,
        );
        expect(properties[0].default).to.equal(cfsProject.coreId);
      }
    });
  });
  */
});
