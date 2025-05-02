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
import fs, { promises as fsp } from "node:fs";
import { expect } from "chai";
import * as chai from "chai";
import {
  CfsPluginInfo,
  CfsFeatureScope,
  CfsSocDataModel,
  SocControl,
  CfsProject,
} from "cfs-plugins-api";
import Zephyr41ProjectPlugin from "../../../../plugins/zephyr41-project-plugin/index.js";
import WorkspacePlugin from "../../../../plugins/default-workspace-plugin/index.js";
import { isDebug } from "../../utilities/test-utilities.js";
import chaiAsPromised from "chai-as-promised";

chai.use(chaiAsPromised);

describe("Extended getProperties method for zephyr41 plugin", () => {
  let projectPlugin: Zephyr41ProjectPlugin;
  let workspacePlugin: WorkspacePlugin;
  let workspacePluginInfo: CfsPluginInfo;
  let projectPluginInfo: CfsPluginInfo;

  // Define workspace and project configurations
  const cfsWorkspace = {
    workspacePluginId: "test-plugin-id",
    workspacePluginVersion: "1.0.0",
    workspaceName: "test-workspace",
    location: "tests/unit-tests/plugins/zephyr41-project-plugin/data",
    copyrightDate: new Date().getFullYear().toString(),
    dataModelVersion: "1.0.0",
    dataModelSchemaVersion: "1.0.0",
    package: "test-package",
    timestamp: new Date().toISOString(),
    board: "test-board",
    soc: "test-soc",
    projects: [{ name: "m4", path: "./m4" }],
  };

  const cfsProject: CfsProject = {
    id: "test-project-id",
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
      const workspacePluginPath = "plugins/default-workspace-plugin/.cfsplugin";
      const absoluteWorkspacePath = path.resolve(workspacePluginPath);
      const workspaceFileContent = await fs.promises.readFile(
        absoluteWorkspacePath,
        "utf-8",
      );
      workspacePluginInfo = JSON.parse(workspaceFileContent) as CfsPluginInfo;
      workspacePluginInfo.pluginPath = absoluteWorkspacePath;
      const projectPluginPath = "plugins/zephyr41-project-plugin/.cfsplugin";
      const absoluteProjectPath = path.resolve(projectPluginPath);
      const projectFileContent = await fs.promises.readFile(
        absoluteProjectPath,
        "utf-8",
      );
      projectPluginInfo = JSON.parse(projectFileContent) as CfsPluginInfo;
      projectPluginInfo.pluginPath = absoluteProjectPath;
    } catch (error) {
      expect.fail(`${error}`);
    }
  });

  beforeEach(() => {
    workspacePlugin = new WorkspacePlugin(workspacePluginInfo, cfsWorkspace);
    projectPlugin = new Zephyr41ProjectPlugin(projectPluginInfo, cfsProject);
  });

  afterEach(async () => {
    if (!isDebug()) {
      await fs.promises.rm(cfsWorkspace.location, {
        recursive: true,
        force: true,
      });
    }
  });

  describe("getProperties", () => {
    const mockSoc = {
      Name: "MAX32690",
      Controls: {
        SPI0: [
          {
            Id: "ENABLE",
            Description: "Enable SPI",
            Type: "boolean",
          },
          {
            Id: "MODE",
            Description: "Operation Mode",
            Type: "enum",
            EnumValues: [
              {
                Id: "FOUR_WIRE",
                Description: "Four-Wire (Standard) Mode",
                Value: 0,
              },
            ],
          },
        ],
        ClockConfig: [
          {
            Id: "TMR0_ENABLE",
            Description: "Enable the TMR0 Clock",
            Type: "boolean",
          },
          {
            Id: "TMR1_ENABLE",
            Description: "Enable the TMR1 Clock",
            Type: "boolean",
          },
          {
            Id: "TMR2_ENABLE",
            Description: "Enable the TMR2 Clock",
            Type: "boolean",
          },
          {
            Id: "TMR3_ENABLE",
            Description: "Enable the TMR3 Clock",
            Type: "boolean",
          },
          {
            Id: "TMR0a_MUX",
            Description: "Clock Source for TMR0a",
            Type: "enum",
            EnumValues: [
              { Id: "PCLK", Description: "Peripheral Clock", Value: 0 },
              {
                Id: "ISO",
                Description: "Internal Secondary Oscillator",
                Value: 1,
              },
              {
                Id: "IBRO",
                Description: "Internal Baud Rate Oscillator",
                Value: 2,
              },
              {
                Id: "ERTCO",
                Description: "External 32kHz Oscillator",
                Value: 3,
              },
            ],
          },
          {
            Id: "TMR0b_MUX",
            Description: "Clock Source for TMR0b",
            Type: "enum",
            EnumValues: [
              { Id: "PCLK", Description: "Peripheral Clock", Value: 0 },
              {
                Id: "ISO",
                Description: "Internal Secondary Oscillator",
                Value: 1,
              },
              {
                Id: "IBRO",
                Description: "Internal Baud Rate Oscillator",
                Value: 2,
              },
              {
                Id: "ERTCO",
                Description: "External 32kHz Oscillator",
                Value: 3,
              },
            ],
          },
          {
            Id: "TMR1a_MUX",
            Description: "Clock Source for TMR1a",
            Type: "enum",
            EnumValues: [
              { Id: "PCLK", Description: "Peripheral Clock", Value: 0 },
              {
                Id: "ISO",
                Description: "Internal Secondary Oscillator",
                Value: 1,
              },
              {
                Id: "IBRO",
                Description: "Internal Baud Rate Oscillator",
                Value: 2,
              },
              {
                Id: "ERTCO",
                Description: "External 32kHz Oscillator",
                Value: 3,
              },
            ],
          },
          {
            Id: "TMR1b_MUX",
            Description: "Clock Source for TMR1b",
            Type: "enum",
            EnumValues: [
              { Id: "PCLK", Description: "Peripheral Clock", Value: 0 },
              {
                Id: "ISO",
                Description: "Internal Secondary Oscillator",
                Value: 1,
              },
              {
                Id: "IBRO",
                Description: "Internal Baud Rate Oscillator",
                Value: 2,
              },
              {
                Id: "ERTCO",
                Description: "External 32kHz Oscillator",
                Value: 3,
              },
            ],
          },
          {
            Id: "TMR2a_MUX",
            Description: "Clock Source for TMR2a",
            Type: "enum",
            EnumValues: [
              { Id: "PCLK", Description: "Peripheral Clock", Value: 0 },
              {
                Id: "ISO",
                Description: "Internal Secondary Oscillator",
                Value: 1,
              },
              {
                Id: "IBRO",
                Description: "Internal Baud Rate Oscillator",
                Value: 2,
              },
              {
                Id: "ERTCO",
                Description: "External 32kHz Oscillator",
                Value: 3,
              },
            ],
          },
          {
            Id: "TMR2b_MUX",
            Description: "Clock Source for TMR2b",
            Type: "enum",
            EnumValues: [
              { Id: "PCLK", Description: "Peripheral Clock", Value: 0 },
              {
                Id: "ISO",
                Description: "Internal Secondary Oscillator",
                Value: 1,
              },
              {
                Id: "IBRO",
                Description: "Internal Baud Rate Oscillator",
                Value: 2,
              },
              {
                Id: "ERTCO",
                Description: "External 32kHz Oscillator",
                Value: 3,
              },
            ],
          },
          {
            Id: "TMR3a_MUX",
            Description: "Clock Source for TMR3a",
            Type: "enum",
            EnumValues: [
              { Id: "PCLK", Description: "Peripheral Clock", Value: 0 },
              {
                Id: "ISO",
                Description: "Internal Secondary Oscillator",
                Value: 1,
              },
              {
                Id: "IBRO",
                Description: "Internal Baud Rate Oscillator",
                Value: 2,
              },
              {
                Id: "ERTCO",
                Description: "External 32kHz Oscillator",
                Value: 3,
              },
            ],
          },
          {
            Id: "TMR3b_MUX",
            Description: "Clock Source for TMR3b",
            Type: "enum",
            EnumValues: [
              { Id: "PCLK", Description: "Peripheral Clock", Value: 0 },
              {
                Id: "ISO",
                Description: "Internal Secondary Oscillator",
                Value: 1,
              },
              {
                Id: "IBRO",
                Description: "Internal Baud Rate Oscillator",
                Value: 2,
              },
              {
                Id: "ERTCO",
                Description: "External 32kHz Oscillator",
                Value: 3,
              },
            ],
          },
        ],
        PinConfig: [
          {
            Id: "MODE",
            Description: "Input or Output Mode",
            EnumValues: [
              {
                Id: "IN",
                Description: "Input Mode",
                Value: 0,
              },
              {
                Id: "OUT",
                Description: "Output Mode",
                Value: 1,
              },
            ],
            Type: "enum",
          },
        ],
      },
      ClockNodes: [
        {
          Name: "TMR0/1/2/3",
          Description: "Timer Peripherals",
          Type: "Peripheral",
          ConfigUIOrder: [
            "TMR0_ENABLE",
            "TMR0a_MUX",
            "TMR0b_MUX",
            "TMR1_ENABLE",
            "TMR1a_MUX",
            "TMR1b_MUX",
            "TMR2_ENABLE",
            "TMR2a_MUX",
            "TMR2b_MUX",
            "TMR3_ENABLE",
            "TMR3a_MUX",
            "TMR3b_MUX",
          ],
        },
      ],
    };

    // Add deep clone function
    const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

    it("should handle peripheral scope", () => {
      const soc = deepClone(mockSoc);

      const result = projectPlugin.getProperties(
        CfsFeatureScope.Peripheral,
        soc as unknown as CfsSocDataModel,
      ) as Record<string, SocControl[]>;

      // Verify structure
      expect(result).to.be.an("object");
      expect(result).to.have.property("SPI0");

      // Verify SPI0 controls
      expect(result.SPI0).to.be.an("array");
      expect(result.SPI0[0]).to.have.property("Id", "FREQ");
      expect(result.SPI0[0].PluginOption).to.be.true;

      // Verify PinConfig and ClockConfig are removed
      expect(result).to.not.have.property("PinConfig");
      expect(result).to.not.have.property("ClockConfig");
    });

    it("should handle PinConfig scope", () => {
      const soc = deepClone(mockSoc);

      const result = projectPlugin.getProperties(
        CfsFeatureScope.PinConfig,
        soc as unknown as CfsSocDataModel,
      ) as Record<string, SocControl[]>;

      const addedControl = {
        Id: "POLARITY",
        Description: "Polarity",
        PluginOption: true,
        EnumValues: [
          {
            Id: "LOW",
            Description: "Active Low",
            Value: 0,
            Zephyr: "GPIO_ACTIVE_LOW",
          },
          {
            Id: "HIGH",
            Description: "Active High",
            Value: 1,
            Zephyr: "GPIO_ACTIVE_HIGH",
          },
        ],
        Type: "enum",
        Condition: "${Node:Name} ${String:P[0-9]\\.[0-9]+} match",
      };

      const modifiedControl = {
        Id: "MODE",
        Description: "GPIO Function Attached",
        EnumValues: [
          {
            Id: "IN",
            Description: "Button",
            Value: 0,
          },
          {
            Id: "OUT",
            Description: "LED",
            Value: 1,
          },
        ],
        Type: "enum",
      };

      expect(result).to.be.an("object");
      expect(result).to.have.property("PinConfig");
      expect(result.PinConfig).to.be.an("array");

      expect(result.PinConfig[0]).to.deep.equal(modifiedControl);

      expect(result.PinConfig[1]).to.deep.equal(addedControl);
    });

    it("should handle ClockConfig scope with TMR0/1/2/3 directives", () => {
      const soc = deepClone(mockSoc);

      const result = projectPlugin.getProperties(
        CfsFeatureScope.ClockConfig,
        soc as unknown as CfsSocDataModel,
      ) as Record<string, SocControl[]>;

      expect(result).to.be.an("object");

      // Verify only the TMR0/1/2/3 node is present
      expect(Object.keys(result)).to.have.lengthOf(1);
      expect(result).to.have.property("TMR0/1/2/3");

      const tmrControls = result["TMR0/1/2/3"];
      expect(tmrControls).to.be.an("array");
      expect(tmrControls).to.have.lengthOf(12); // All 12 controls from ConfigUIOrder

      // Verify the controls are in the correct order according to ConfigUIOrder
      const expectedOrder = [
        "TMR0_ENABLE",
        "TMR0a_MUX",
        "TMR0b_MUX",
        "TMR1_ENABLE",
        "TMR1a_MUX",
        "TMR1b_MUX",
        "TMR2_ENABLE",
        "TMR2a_MUX",
        "TMR2b_MUX",
        "TMR3_ENABLE",
        "TMR3a_MUX",
        "TMR3b_MUX",
      ];

      expectedOrder.forEach((controlId, index) => {
        expect(tmrControls[index].Id).to.equal(controlId);
      });

      // Check the modified TMRxb_MUX controls as per the plugin directives
      const tmrBMuxIds = ["TMR0b_MUX", "TMR1b_MUX", "TMR2b_MUX", "TMR3b_MUX"];
      tmrBMuxIds.forEach((id) => {
        const control = tmrControls.find((c) => c.Id === id);
        expect(control).to.exist;
        expect(control?.EnumValues).to.have.lengthOf(1);
        expect(control?.EnumValues?.[0]).to.deep.include({
          Id: "32BIT",
          Description: "N/A - 32-bit Mode",
          Value: 4,
        });
      });
    });

    it("should handle missing soc parameter", () => {
      const result = projectPlugin.getProperties(CfsFeatureScope.Peripheral);
      expect(result).to.deep.equal(projectPluginInfo.properties?.peripheral);
    });
  });
});
