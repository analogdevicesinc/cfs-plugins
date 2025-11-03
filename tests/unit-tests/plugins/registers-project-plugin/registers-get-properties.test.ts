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
  CfsSocDataModel,
} from "cfs-plugins-api";
import { GenericPlugin } from "../../../../api/src/generic/cfs-generic-plugin.js";
import { expect } from "chai";

describe("getProperties method for registers-only project plugin", () => {
  let projectPlugin: GenericPlugin;
  let projectPluginInfo: CfsPluginInfo;

  const cfsProject: CfsProject = {
    id: "test-project-id",
    coreId: "the-core-id",
    package: "test-package",
    board: "test-board",
    soc: "test-soc",
    name: "test-project",
    path: "tests/unit-tests/plugins/registers-project-plugin/data/test-workspace",
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
    projectPlugin = new GenericPlugin(projectPluginInfo);
  });

  describe("getProperties", () => {
    it("should replace dynamic values with values from context when getting properties", () => {
      const properties = projectPlugin.getProperties(
        CfsFeatureScope.Project,
        cfsProject,
      );

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

  describe("overrideControls", () => {
    const mockSoc = {
      Name: "MAX32690",
      Controls: {
        PinConfig: [
          {
            Id: "MODE",
            Description: "Input or Output Mode",
            Type: "enum",
            EnumValues: [
              { Id: "IN", Description: "Input Mode", Value: 0 },
              { Id: "OUT", Description: "Output Mode", Value: 1 },
            ],
          },
          {
            Id: "DS",
            Description: "Drive Strength",
            Type: "enum",
            EnumValues: [
              { Id: "0", Description: "Drive Strength 0", Value: 0 },
              { Id: "1", Description: "Drive Strength 1", Value: 1 },
            ],
          },
        ],
      },
      ClockNodes: [],
      Cores: [],

      Packages: [],
      Peripherals: [],
      Registers: [],
      Schema: "1.0.0",
      Version: "1.0.0",
    };

    it("should handle PinConfig scope", () => {
      const result = projectPlugin.overrideControls(
        CfsFeatureScope.PinConfig,
        mockSoc as unknown as CfsSocDataModel,
      );

      expect(result).to.be.an("object");
      expect(result).to.have.property("PinConfig");
      expect(result.PinConfig).to.be.an("array");
      expect(result.PinConfig.length).to.equal(2);
      expect(result.PinConfig[0]).to.have.property("Id", "MODE");
      expect(result.PinConfig[1]).to.have.property("Id", "DS");
    });
  });
});
