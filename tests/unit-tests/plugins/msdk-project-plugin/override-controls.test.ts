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
import MsdkProjectPlugin from "@plugins/msdk-project-plugin/index.js";
import { loadPluginInfoSync } from "@utilities/test-utilities.js";

const PROJECT_MANIFEST = "plugins/dist/msdk-project-plugin/.cfsplugin";

const deepClone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/**
 * A fully fictional SoC data model with peripheral, pin, clock and memory
 * controls. The plugin's `overrideControls` directives match on control and
 * clock-node ids rather than the SoC name, so this fictional part exercises
 * the scope filtering, TMR0/1/2/3 clock directives, memory NAME_OVERRIDE
 * injection, and PinConfig passthrough without coupling to a shipped part.
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
        Id: "FREQ",
        Description: "SPI Frequency",
        Type: "enum",
        EnumValues: [
          { Id: "1MHZ", Description: "1 MHz", Value: 0 },
          { Id: "2MHZ", Description: "2 MHz", Value: 1 },
        ],
      },
    ],
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
    ],
    ClockConfig: [
      {
        Id: "TMR0_ENABLE",
        Description: "Enable the TMR0 Clock",
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
          { Id: "32BIT", Description: "32-bit Mode", Value: 4 },
        ],
      },
    ],
  },
  ClockNodes: [
    {
      Name: "TMR0/1/2/3",
      Description: "Timer Peripherals",
      Type: "Peripheral",
      ConfigUIOrder: ["TMR0_ENABLE", "TMR0a_MUX", "TMR0b_MUX"],
    },
  ],
  Memory: [
    {
      Group: "FLASH",
      Regions: [
        {
          Name: "FLASH",
          StartAddress: "0x10000000",
          Size: 1048576,
        },
      ],
    },
    {
      Group: "SRAM",
      Regions: [
        {
          Name: "SRAM",
          StartAddress: "0x20000000",
          Size: 524288,
        },
      ],
    },
  ],
} as unknown as CfsSocDataModel;

describe("MSDK project plugin - overrideControls", () => {
  const projectPluginInfo: CfsPluginInfo = loadPluginInfoSync(PROJECT_MANIFEST);
  let projectPlugin: MsdkProjectPlugin;

  beforeEach(() => {
    projectPlugin = new MsdkProjectPlugin(projectPluginInfo);
  });

  it("returns a control map for the peripheral scope", () => {
    const result = projectPlugin.overrideControls(
      "peripheral",
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

  it("filters peripheral scope to exclude PinConfig and ClockConfig", () => {
    const soc = deepClone(fakeSocDataModel);

    const result = projectPlugin.overrideControls("peripheral", soc);

    expect(result).to.be.an("object");
    expect(result).to.have.property("SPI0");
    const frequencyControl = result.SPI0.find(
      (control) => control.Id === "FREQ",
    );
    expect(frequencyControl, "FREQ control should be present").to.exist;
    expect(frequencyControl?.PluginOption).to.be.true;
    expect(result).to.not.have.property("PinConfig");
    expect(result).to.not.have.property("ClockConfig");
  });

  it("handles the clockConfig scope with TMR0/1/2/3 defaultOverrides", () => {
    const soc = deepClone(fakeSocDataModel);

    const result = projectPlugin.overrideControls("clockConfig", soc);

    expect(result).to.be.an("object");
    expect(result).to.have.property("TMR0/1/2/3");

    const tmrControls = result["TMR0/1/2/3"];
    expect(tmrControls).to.be.an("array");

    const tmr0bMux = tmrControls.find((c) => c.Id === "TMR0b_MUX");
    expect(tmr0bMux, "TMR0b_MUX control should be present").to.exist;
    expect(tmr0bMux?.Default).to.equal("32BIT");

    const tmr0Enable = tmrControls.find((c) => c.Id === "TMR0_ENABLE");
    expect(tmr0Enable, "TMR0_ENABLE control should be retained").to.exist;

    const tmr0aMux = tmrControls.find((c) => c.Id === "TMR0a_MUX");
    expect(tmr0aMux, "TMR0a_MUX control should be retained").to.exist;
  });

  it("handles the memory scope and adds NAME_OVERRIDE control", () => {
    const soc = deepClone(fakeSocDataModel);

    const result = projectPlugin.overrideControls("memory", soc);

    expect(result).to.be.an("object");

    const allControls = Object.values(result).flat();
    const nameOverride = allControls.find(
      (control) => control.Id === "NAME_OVERRIDE",
    );

    expect(nameOverride).to.deep.equal({
      Id: "NAME_OVERRIDE",
      Description: "Memory Region Name Override",
      Type: "text",
      Pattern: "[_a-zA-Z][_a-zA-Z0-9]*",
      Scope: "${ProjectId} ${String: memory regions} +",
      PluginOption: true,
    });

    expect(result).to.have.property("memory");
    expect(result.memory).to.be.an("array").that.is.not.empty;
  });

  it("handles the pinConfig scope", () => {
    const soc = deepClone(fakeSocDataModel);

    const result = projectPlugin.overrideControls("pinConfig", soc);

    expect(result).to.have.property("PinConfig");
    expect(result.PinConfig.map((control) => control.Id)).to.deep.equal([
      "MODE",
    ]);
  });
});
