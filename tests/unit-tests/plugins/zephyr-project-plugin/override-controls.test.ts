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

import { expect } from "chai";
import type {
  CfsFeatureScope,
  CfsPluginInfo,
  CfsSocDataModel,
} from "cfs-types";
import ZephyrProjectPlugin from "@plugins/zephyr-project-plugin/index.js";
import { loadPluginInfoSync } from "@utilities/test-utilities.js";

// Project-plugin manifest, read from the built `plugins/dist/` output.
const PROJECT_MANIFEST = "plugins/dist/zephyr-project-plugin/.cfsplugin";

const deepClone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/**
 * A fully fictional SoC data model (`Name: "MOCKSOC1"`) with peripheral, pin and
 * clock controls. The plugin's `overrideControls` directives match on control
 * and clock-node ids rather than the SoC name, so this fictional part exercises
 * the FREQ injection, GPIO pin-config remap and TMR0/1/2/3 clock directives
 * without coupling the tests to a real, shipped part number.
 */
const fakeSocDataModel = {
  Name: "MOCKSOC1",
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
} as unknown as CfsSocDataModel;

// The plugin's control-override directives key off control and clock-node ids
// rather than the SoC name, so a fully fictional SoC exercises the exact same
// logic without coupling the assertions to a shipped part number.
describe("Zephyr project plugin - overrideControls", () => {
  const projectPluginInfo: CfsPluginInfo = loadPluginInfoSync(PROJECT_MANIFEST);
  let projectPlugin: ZephyrProjectPlugin;

  beforeEach(() => {
    projectPlugin = new ZephyrProjectPlugin(projectPluginInfo);
  });

  // A known scope returns a control-map object; an unknown scope does not throw.
  it("returns a control map for the pinConfig scope", () => {
    const result = projectPlugin.overrideControls(
      "pinConfig",
      deepClone(fakeSocDataModel),
    );
    expect(result).to.be.an("object");
  });

  it("does not throw for an unknown scope", () => {
    expect(() =>
      projectPlugin.overrideControls(
        "fakeScope" as CfsFeatureScope,
        deepClone(fakeSocDataModel),
      ),
    ).to.not.throw();
  });

  // Zephyr-specific overrideControls behavior: peripheral FREQ injection, GPIO
  // pin-config remapping, and the TMR0/1/2/3 clock-config directives.
  it("injects the FREQ plugin option for the peripheral scope", () => {
    const soc = deepClone(fakeSocDataModel);

    const result = projectPlugin.overrideControls("peripheral", soc);

    expect(result).to.be.an("object");
    expect(result).to.have.property("SPI0");

    expect(result.SPI0).to.be.an("array");
    expect(result.SPI0[0]).to.have.property("Id", "FREQ");
    expect(result.SPI0[0].PluginOption).to.be.true;

    // Pin and clock controls are not part of the peripheral scope.
    expect(result).to.not.have.property("PinConfig");
    expect(result).to.not.have.property("ClockConfig");
  });

  it("remaps GPIO controls for the pinConfig scope", () => {
    const soc = deepClone(fakeSocDataModel);

    const result = projectPlugin.overrideControls("pinConfig", soc);

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

  it("applies the TMR0/1/2/3 directives for the clockConfig scope", () => {
    const soc = deepClone(fakeSocDataModel);

    const result = projectPlugin.overrideControls("clockConfig", soc);

    expect(result).to.be.an("object");

    // Only the TMR0/1/2/3 clock node survives the override.
    expect(Object.keys(result)).to.have.lengthOf(1);
    expect(result).to.have.property("TMR0/1/2/3");

    const tmrControls = result["TMR0/1/2/3"];
    expect(tmrControls).to.be.an("array");
    expect(tmrControls).to.have.lengthOf(12); // All 12 controls from ConfigUIOrder

    // Controls are ordered according to ConfigUIOrder.
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

    // The TMRxb_MUX controls are modified per the plugin directives.
    const tmrBMuxIds = ["TMR0b_MUX", "TMR1b_MUX", "TMR2b_MUX", "TMR3b_MUX"];
    tmrBMuxIds.forEach((id) => {
      const control = tmrControls.find((c) => c.Id === id);
      expect(control).to.exist;
      // 4 original data model values (marked Inactive) + 1 plugin-added value.
      expect(control?.EnumValues).to.have.lengthOf(5);

      // The original data model values are marked Inactive.
      const inactiveValues = control?.EnumValues?.filter((v) => v.Inactive);
      expect(inactiveValues).to.have.lengthOf(4);

      // The plugin-added 32BIT option is present and active.
      const activeValue = control?.EnumValues?.find((v) => v.Id === "32BIT");
      expect(activeValue).to.deep.include({
        Id: "32BIT",
        Description: "N/A - 32-bit Mode",
        Value: 4,
      });
      expect(activeValue).to.not.have.property("Inactive");
    });
  });
});
