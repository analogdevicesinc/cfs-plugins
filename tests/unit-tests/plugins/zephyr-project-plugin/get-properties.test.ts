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

import os from "node:os";
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
  CfsPluginProperty,
} from "cfs-plugins-api";
import { GenericPlugin } from "cfs-plugins-api/src/generic/cfs-generic-plugin.js";
import ZephyrProjectPlugin from "../../../../plugins/zephyr-project-plugin/index.js";
import { isDebug } from "../../utilities/test-utilities.js";
import chaiAsPromised from "chai-as-promised";

chai.use(chaiAsPromised);

describe("Extended getProperties method for zephyr project plugin", () => {
  let projectPlugin: ZephyrProjectPlugin;
  let workspacePlugin: GenericPlugin;
  let workspacePluginInfo: CfsPluginInfo;
  let projectPluginInfo: CfsPluginInfo;

  // Define workspace and project configurations
  const cfsWorkspace = {
    workspacePluginId: "test-plugin-id",
    workspacePluginVersion: "1.0.0",
    workspaceName: "test-workspace",
    location: "tests/unit-tests/plugins/zephyr-project-plugin/data",
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
    path: "tests/unit-tests/plugins/zephyr-project-plugin/data/test-workspace",
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
      const projectPluginPath = "plugins/zephyr-project-plugin/.cfsplugin";
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
    workspacePlugin = new GenericPlugin(workspacePluginInfo);
    projectPlugin = new ZephyrProjectPlugin(projectPluginInfo);
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

      const result = projectPlugin.overrideControls(
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

      const result = projectPlugin.overrideControls(
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
          },
          {
            Id: "HIGH",
            Description: "Active High",
            Value: 1,
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

      const result = projectPlugin.overrideControls(
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

    it("should handle getting properties based on platform", () => {
      for (let i = 0; i < 2; i++) {
        const result = projectPlugin.getProperties(CfsFeatureScope.Project, {
          soc: mockSoc.Name,
        }) as CfsPluginProperty[];

        const numberOfOptions = os.platform() === "win32" ? 1 : 2;
        expect(
          result.find((item) => item.id === "BuildSystem")!.enum!.length,
        ).to.eq(numberOfOptions);
      }
    });

    it("should include EnableCoreDrump property for MAX32690", () => {
      const result = projectPlugin.getProperties(CfsFeatureScope.Project, {
        soc: mockSoc.Name,
      }) as CfsPluginProperty[];

      const enableCoreDumpProp = result.find(
        (prop) => prop.id === "EnableCoreDump",
      );
      expect(enableCoreDumpProp).to.exist;
    });

    it("should not return EnableCoreDump when soc is different than MAX32690", () => {
      const mockMAX32655 = { ...deepClone(mockSoc), Name: "max32655" };
      const result = projectPlugin.getProperties(CfsFeatureScope.Project, {
        soc: mockMAX32655.Name,
      }) as CfsPluginProperty[];
      const enableCoreDumpProp = result.find(
        (prop) => prop.id === "EnableCoreDump",
      );
      expect(enableCoreDumpProp).to.be.undefined;
    });

    it("should not return EnableCoreDump prop when no context is passed", () => {
      const result = projectPlugin.getProperties(
        CfsFeatureScope.Project,
      ) as CfsPluginProperty[];

      const enableCoreDumpProp = result.find(
        (prop) => prop.id === "EnableCoreDump",
      );

      expect(enableCoreDumpProp).to.be.undefined;
    });

    it("should not return EnableCoreDump prop when context is passed with other key value pairs", () => {
      const result = projectPlugin.getProperties(CfsFeatureScope.Project, {
        someKey: "some-value",
      }) as CfsPluginProperty[];

      const enableCoreDumpProp = result.find(
        (prop) => prop.id === "EnableCoreDump",
      );

      expect(enableCoreDumpProp).to.be.undefined;
    });

    it("should return board name based on firmware when default does not exist", () => {
      const boardId = "evkit_v1";
      const soc = "max32690";

      const result = projectPlugin.getProperties(CfsFeatureScope.Project, {
        boardId,
        soc,
      });

      const boardNameProp = result.find(
        (prop) => prop.id === "ZephyrBoardName",
      );

      expect(boardNameProp).to.exist;
      expect(boardNameProp?.default).to.eq("max32690evkit/max32690/m4");
    });
  });
});
