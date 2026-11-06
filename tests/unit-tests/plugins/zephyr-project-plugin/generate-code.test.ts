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

import path from "node:path";
import { promises as fs } from "node:fs";
import { expect } from "chai";
import type {
  CfsCodeGenerationContext,
  CfsConfig,
  CfsPluginInfo,
  CfsSocDataModel,
  ConfiguredClockNode,
  ConfiguredPeripheral,
} from "cfs-types";
import ZephyrProjectPlugin from "@plugins/zephyr-project-plugin/index.js";
import {
  fileExists,
  isDebug,
  loadPluginInfoSync,
} from "@utilities/test-utilities.js";
import { joinPath } from "@utilities/path-utilities.js";
import { validateJsonFile } from "@utilities/validate-json.js";

// Project-plugin manifest, read from the built `plugins/dist/` output.
const PROJECT_MANIFEST = "plugins/dist/zephyr-project-plugin/.cfsplugin";

// Scratch directory the suite writes into and cleans after each test.
const DATA_DIR = "tests/unit-tests/plugins/zephyr-project-plugin/data";
const WORKSPACE_NAME = "test-workspace";

// Real MAX32690 WLP SoC data model (checked in) for code-generation tests.
const SOC_DATA_MODEL_WLP = "tests/unit-tests/soc/max32690-wlp.json";

/** Build a fresh Zephyr mock system config for `generateCode`. */
function buildMockCfsConfig(): CfsConfig {
  return {
    Copyright:
      "Copyright (c) 2024 Analog Devices, Inc.  All rights reserved. This software is proprietary to Analog Devices, Inc. and its licensors.",
    SchemaVersion: "2.1.0",
    DataModelVersion: "0.0.25",
    Soc: "MAX32690",
    Package: "WLP",
    Pins: [],
    ClockNodes: [],
    Timestamp: new Date().toISOString(),
    BoardName: "AD-APARD32690-SL",
    Projects: [
      {
        CoreId: "CM4",
        ProjectId: "CM4",
        PluginId: "string",
        PluginVersion: "string",
        FirmwarePlatform: "zephyr",
        ExternallyManaged: true,
        Partitions: [
          {
            Name: "Name",
            StartAddress: "0x20000000",
            Size: 2048,
            IsOwner: true,
            Access: "R/W",
            Config: {},
          },
        ],
        PlatformConfig: {
          ProjectName: "m4",
          ZephyrVersion: "4.3.0",
          ZephyrBoardName: "apard32690/max32690/m4",
        },
        Peripherals: [{ Name: "Name", Signals: [], Config: {} }],
      },
    ],
  };
}

describe("Zephyr project plugin - generateCode", () => {
  const codeGenBasePath = `${DATA_DIR}/${WORKSPACE_NAME}`;
  const projectPluginInfo: CfsPluginInfo = loadPluginInfoSync(PROJECT_MANIFEST);
  let projectPlugin: ZephyrProjectPlugin;

  beforeEach(() => {
    projectPlugin = new ZephyrProjectPlugin(projectPluginInfo);
  });

  afterEach(async () => {
    if (!isDebug()) {
      await fs.rm(DATA_DIR, { recursive: true, force: true });
    }
  });

  // Manifest drift guard: these tests pin to the MAX32690 data models checked in
  // under tests/unit-tests/soc/. Breadth across every SoC is the workspace-plugin
  // codegen tests' job (they download each SoC data model); here we only guard
  // that the SoC this file exercises is still supported, so a dropped part
  // surfaces as a failure instead of a test running against a removed SoC.
  it("still supports the MAX32690 SoC these tests target", () => {
    const targetSoc = buildMockCfsConfig().Soc.toLowerCase();
    const supported = projectPluginInfo.supportedSocs.map((soc) =>
      soc.name.toLowerCase(),
    );
    expect(supported, `${targetSoc} should be a supported SoC`).to.include(
      targetSoc,
    );
  });

  it("generates code files that exist on disk and are valid JSON", async () => {
    const socPath = path.resolve(SOC_DATA_MODEL_WLP);
    expect(
      await fileExists(socPath),
      `SoC data model does not exist: ${socPath}`,
    ).to.be.true;

    const datamodel = JSON.parse(
      await fs.readFile(socPath, "utf-8"),
    ) as CfsSocDataModel;

    const context: CfsCodeGenerationContext = {
      cfsconfig: buildMockCfsConfig(),
      datamodel,
      projectId: "CM4",
      coreId: "CM4",
    };

    const filesGenerated = await projectPlugin.generateCode(
      context,
      joinPath(DATA_DIR, "codegen"),
    );

    expect(filesGenerated).to.be.an("array");
    expect(
      filesGenerated.length,
      "generateCode should produce at least one file",
    ).to.be.greaterThan(0);

    for (const file of filesGenerated) {
      expect(
        await fileExists(file),
        `Reported generated file should exist: ${file}`,
      ).to.be.true;
      if (path.extname(file).toLowerCase() === ".json") {
        expect(
          await validateJsonFile(file),
          `Generated JSON file is invalid: ${file}`,
        ).to.be.true;
      }
    }
  });

  it("generates the Arm (CM4) board conf and overlay", async () => {
    const cfsConfig = buildMockCfsConfig();
    const socPath = path.resolve(
      `tests/unit-tests/soc/${cfsConfig.Soc.toLowerCase()}-${cfsConfig.Package.toLowerCase()}.json`,
    );
    expect(await fileExists(socPath), `Soc path does not exist: ${socPath}`).to
      .be.true;

    const socData = JSON.parse(
      await fs.readFile(socPath, "utf-8"),
    ) as CfsSocDataModel;

    const codeGenData: CfsCodeGenerationContext = {
      cfsconfig: cfsConfig,
      datamodel: socData,
      projectId: "CM4",
      coreId: "CM4",
    };

    const filesGenerated = await projectPlugin.generateCode(
      codeGenData,
      codeGenBasePath,
    );

    const expectedFiles = [
      "boards/apard32690_max32690_m4.conf",
      "boards/apard32690_max32690_m4.overlay",
    ];

    const projectName =
      cfsConfig.Projects.find((project) => project.ProjectId === "CM4")
        ?.PlatformConfig.ProjectName ?? "";

    for (const file of expectedFiles) {
      const filePath = joinPath(codeGenBasePath, projectName, file);
      expect(
        await fileExists(filePath),
        `File ${file} should exist in the project directory`,
      ).to.be.true;
    }

    expect(
      expectedFiles.every((expectedFile) =>
        filesGenerated.some(
          (generatedFile) =>
            path.normalize(generatedFile) ===
            path.normalize(`${codeGenBasePath}/${projectName}/${expectedFile}`),
        ),
      ),
      `Expected files: ${expectedFiles.join(
        ", ",
      )} are not found in generated files: ${filesGenerated.join(", ")}`,
    ).to.be.true;
  });

  it("generates RV code without clock configuration", async () => {
    const socPath = path.resolve("tests/unit-tests/soc/max32690-tqfn.json");
    expect(await fileExists(socPath), `Soc path does not exist: ${socPath}`).to
      .be.true;

    const socData = JSON.parse(
      await fs.readFile(socPath, "utf-8"),
    ) as CfsSocDataModel;

    const rvCfsConfig: CfsConfig = {
      ...buildMockCfsConfig(),
      Soc: "MAX32690",
      Package: "TQFN",
      BoardName: "EvKit_V1",
      Projects: [
        {
          CoreId: "RV",
          ProjectId: "RV",
          PluginId: "string",
          PluginVersion: "string",
          FirmwarePlatform: "zephyr",
          ExternallyManaged: false,
          Partitions: [],
          PlatformConfig: {
            ProjectName: "rv32",
            ZephyrVersion: "4.4.0",
            ZephyrBoardName: "max32690evkit/max32690/rv32",
          },
          Peripherals: [{ Name: "Name", Signals: [], Config: {} }],
        },
      ],
    };

    const codeGenData: CfsCodeGenerationContext = {
      cfsconfig: rvCfsConfig,
      datamodel: socData,
      projectId: "RV",
      coreId: "RV",
    };

    const filesGenerated = await projectPlugin.generateCode(
      codeGenData,
      codeGenBasePath,
    );

    const expectedFiles = [
      "boards/max32690evkit_max32690_rv32.conf",
      "boards/max32690evkit_max32690_rv32.overlay",
    ];

    const projectName = "rv32";
    for (const file of expectedFiles) {
      const filePath = joinPath(codeGenBasePath, projectName, file);
      expect(
        await fileExists(filePath),
        `File ${file} should exist in the project directory`,
      ).to.be.true;
    }

    expect(
      expectedFiles.every((expectedFile) =>
        filesGenerated.some(
          (generatedFile) =>
            path.normalize(generatedFile) ===
            path.normalize(`${codeGenBasePath}/${projectName}/${expectedFile}`),
        ),
      ),
      "RV core code generation should report the generated board files",
    ).to.be.true;

    const overlayPath = joinPath(
      codeGenBasePath,
      projectName,
      "boards/max32690evkit_max32690_rv32.overlay",
    );
    const overlayContent = await fs.readFile(overlayPath, "utf-8");

    // RV core overlay should NOT contain clock configuration.
    expect(overlayContent).to.not.include(
      "Clock Configuration and Initialization",
      "RV core overlay should not contain clock configuration section",
    );
    expect(overlayContent).to.not.match(
      /&clk_/,
      "RV core overlay should not contain clock node references",
    );

    // RV-compatible peripherals remain; CM4-only peripherals are excluded.
    expect(overlayContent).to.include(
      "Peripheral Configuration",
      "RV core overlay should still contain peripheral configuration section",
    );
    expect(overlayContent).to.include(
      "&adc {",
      "RV core overlay should contain RV-compatible peripheral nodes",
    );
    expect(overlayContent).to.not.include(
      "&usbhs {",
      "RV core overlay should not contain CM4-only peripheral nodes",
    );
  });

  // Generate the MAX32690 WLP (CM4) devicetree overlay for the given Zephyr
  // version, set of assigned peripherals, and optional clock-node settings,
  // returning the overlay contents.
  async function generateMax32690Overlay(
    zephyrVersion: string,
    assignedPeripherals: string[],
    clockNodes: ConfiguredClockNode[] = [],
  ): Promise<string> {
    const socPath = path.resolve(SOC_DATA_MODEL_WLP);
    const socData = JSON.parse(
      await fs.readFile(socPath, "utf-8"),
    ) as CfsSocDataModel;

    const baseConfig = buildMockCfsConfig();
    const config: CfsConfig = {
      ...baseConfig,
      ClockNodes: clockNodes,
      Projects: [
        {
          ...baseConfig.Projects[0],
          PlatformConfig: {
            ...baseConfig.Projects[0].PlatformConfig,
            ProjectName: "m4",
            ZephyrVersion: zephyrVersion,
            ZephyrBoardName: "apard32690/max32690/m4",
          },
          Peripherals: assignedPeripherals.map(
            (name): ConfiguredPeripheral => ({
              Name: name,
              Signals: [],
              Config: {},
            }),
          ),
        },
      ],
    };

    const codeGenData: CfsCodeGenerationContext = {
      cfsconfig: config,
      datamodel: socData,
      projectId: "CM4",
      coreId: "CM4",
    };

    await projectPlugin.generateCode(codeGenData, codeGenBasePath);

    const overlayPath = joinPath(
      codeGenBasePath,
      "m4",
      "boards/apard32690_max32690_m4.overlay",
    );
    return fs.readFile(overlayPath, "utf-8");
  }

  it("emits a devicetree warning for an assigned unsupported peripheral", async () => {
    // I2S0 exists in the data model but has no Zephyr peripheral mapping, so
    // assigning it must produce the auto-generated "not currently supported"
    // warning, while the supported UART0 peripheral still renders a node.
    const overlay = await generateMax32690Overlay("4.3.0", ["UART0", "I2S0"]);

    expect(overlay).to.include(
      "#warning The Inter-IC Sound Interface peripheral is not currently supported in Zephyr.",
      "Overlay should warn about the assigned, unsupported I2S0 peripheral",
    );
    expect(overlay).to.include(
      "&uart0 {",
      "Overlay should still contain the supported UART0 peripheral node",
    );
    expect(overlay).to.not.include(
      "&i2s0 {",
      "Unsupported I2S0 peripheral should not be rendered as a devicetree node",
    );
  });

  it("treats version-filtered peripherals as unsupported below the minimum Zephyr version", async () => {
    // WUT0 requires Zephyr 4.3.0. Below that version filterByZephyrVersion()
    // must move it to the unsupported list (warning, no node); at/above it must
    // remain supported and render a devicetree node.
    const belowMinOverlay = await generateMax32690Overlay("4.2.0", ["WUT0"]);
    expect(belowMinOverlay).to.include(
      "#warning The WUT0 peripheral is not supported in Zephyr for this configuration. Supported in Zephyr version 4.3.0 or later.",
      "WUT0 should be reported as unsupported below its minimum Zephyr version",
    );
    expect(belowMinOverlay).to.not.include(
      "&wut0 {",
      "WUT0 should not render a node below its minimum Zephyr version",
    );

    const atMinOverlay = await generateMax32690Overlay("4.3.0", ["WUT0"]);
    expect(atMinOverlay).to.include(
      "&wut0 {",
      "WUT0 should render a node at its minimum Zephyr version",
    );
    expect(atMinOverlay).to.not.include(
      "The WUT0 peripheral is not supported in Zephyr for this configuration",
      "WUT0 should not be reported as unsupported at its minimum Zephyr version",
    );
  });

  it("retains manually added devicetree warnings passed to the helper", async () => {
    // The RTC SQWOUT clock setting is a manually added unsupported entry (the
    // second argument to buildUnsupportedZephyrEntries). Assigning RTC and
    // enabling SQWOUT must still surface its warning, proving the manual list
    // is preserved rather than dropped or overwritten by the auto-generated
    // entries.
    const overlay = await generateMax32690Overlay(
      "4.3.0",
      ["RTC"],
      [{ Name: "SQWOUT", Control: "SQWOUT", Value: "1HZ", Enabled: true }],
    );

    expect(overlay).to.include(
      "#warning Enabling SQWOUT from the RTC is not currently supported in devicetree.",
      "Overlay should retain the manually added RTC SQWOUT warning",
    );
  });

  // Build a minimal MAX32690 (CM4) overlay, optionally injecting a mock board
  // devicetree (boardDts) and partition set. A mock boardDts exercises the
  // DTS-driven overlay branches (SRAM node deletion, mapped vs fixed flash
  // partitions, chosen-property deletion) without needing a real Zephyr tree.
  // Passing rvProject adds a sibling RV core project (with the given
  // ExternallyManaged flag) so the code-rv32-partition deletion branch, which
  // is gated on an externally managed RV project, can be exercised.
  async function generateMax32690OverlayWithBoardDts(options: {
    partitions?: unknown[];
    boardDts?: Record<string, unknown>;
    rvProject?: { externallyManaged: boolean };
  }): Promise<string> {
    const socPath = path.resolve(SOC_DATA_MODEL_WLP);
    const socData = JSON.parse(
      await fs.readFile(socPath, "utf-8"),
    ) as CfsSocDataModel;

    const baseConfig = buildMockCfsConfig();
    const projects: CfsConfig["Projects"] = [
      {
        ...baseConfig.Projects[0],
        Partitions: (options.partitions ??
          baseConfig.Projects[0]
            .Partitions) as CfsConfig["Projects"][number]["Partitions"],
        Peripherals: [],
        PlatformConfig: {
          ...baseConfig.Projects[0].PlatformConfig,
          ProjectName: "m4",
          ZephyrVersion: "4.4.0",
          ZephyrBoardName: "apard32690/max32690/m4",
        },
      },
    ];

    if (options.rvProject) {
      projects.push({
        ...baseConfig.Projects[0],
        CoreId: "RV",
        ProjectId: "RV",
        ExternallyManaged: options.rvProject.externallyManaged,
        Partitions: [],
        Peripherals: [],
        PlatformConfig: {
          ...baseConfig.Projects[0].PlatformConfig,
          ProjectName: "rv32",
          ZephyrVersion: "4.4.0",
          ZephyrBoardName: "apard32690/max32690/rv32",
        },
      });
    }

    const config: CfsConfig = {
      ...baseConfig,
      Projects: projects,
    };

    const codeGenData: CfsCodeGenerationContext = {
      cfsconfig: config,
      datamodel: socData,
      projectId: "CM4",
      coreId: "CM4",
      ...(options.boardDts ? { boardDts: options.boardDts } : {}),
    };

    await projectPlugin.generateCode(codeGenData, codeGenBasePath);

    const overlayPath = joinPath(
      codeGenBasePath,
      "m4",
      "boards/apard32690_max32690_m4.overlay",
    );
    return fs.readFile(overlayPath, "utf-8");
  }

  it("deletes SRAM nodes from the base devicetree when the board defines them", async () => {
    // The board devicetree labels the M4 SRAM node, so the overlay must delete
    // it before redefining the memory region.
    const overlay = await generateMax32690OverlayWithBoardDts({
      boardDts: { soc: { sram: { nodeLabels: ["m4_sram"] } } },
    });
    expect(overlay).to.include(
      "/delete-node/ &m4_sram;",
      "Overlay should delete the board-defined m4_sram node",
    );
  });

  it("does not delete SRAM nodes when the board devicetree does not define them", async () => {
    // With no boardDts (no zephyrBase), the SRAM deletion branch must stay off.
    const overlay = await generateMax32690OverlayWithBoardDts({});
    expect(overlay).to.not.include(
      "/delete-node/ &m4_sram;",
      "Overlay should not delete SRAM nodes absent a board devicetree",
    );
  });

  it("emits mapped flash partitions when the board devicetree uses ranges", async () => {
    // A board whose flash `partitions` node has `ranges` must produce mapped
    // partitions (compatible = "zephyr,mapped-partition").
    const overlay = await generateMax32690OverlayWithBoardDts({
      partitions: [
        {
          Name: "slot0_partition",
          StartAddress: "0x10000000",
          Size: 64,
          IsOwner: true,
          Access: "R/W",
          Config: {},
        },
      ],
      boardDts: { flash0: { partitions: { ranges: true } } },
    });
    expect(overlay).to.include(
      'compatible = "zephyr,mapped-partition";',
      "Mapped board should emit zephyr,mapped-partition",
    );
    expect(overlay).to.not.include(
      'compatible = "fixed-partitions";',
      "Mapped board should not emit fixed-partitions",
    );
  });

  it("emits fixed flash partitions when the board devicetree lacks ranges", async () => {
    // The same flash partition on a board without `ranges` must fall back to
    // fixed-partitions and omit the mapped-partition compatible.
    const overlay = await generateMax32690OverlayWithBoardDts({
      partitions: [
        {
          Name: "slot0_partition",
          StartAddress: "0x10000000",
          Size: 64,
          IsOwner: true,
          Access: "R/W",
          Config: {},
        },
      ],
    });
    expect(overlay).to.include(
      'compatible = "fixed-partitions";',
      "Board without ranges should emit fixed-partitions",
    );
    expect(overlay).to.not.include(
      'compatible = "zephyr,mapped-partition";',
      "Board without ranges should not emit mapped partitions",
    );
  });

  it("deletes the settings-partition chosen property when the board defines it", async () => {
    // When the board devicetree chooses zephyr,settings-partition, the overlay
    // must delete that property so the generated partitions take effect.
    const overlay = await generateMax32690OverlayWithBoardDts({
      boardDts: {
        chosen: { "zephyrsettings-partition": "&settings_partition" },
      },
    });
    expect(overlay).to.include(
      "/delete-property/ zephyr,settings-partition;",
      "Overlay should delete the board's settings-partition chosen property",
    );
  });

  it("deletes the code-rv32-partition chosen property when an externally managed RV project defines it", async () => {
    // The deletion is gated on an externally managed RV project: with such a
    // project and a matching board chosen property, the overlay must delete it.
    const overlay = await generateMax32690OverlayWithBoardDts({
      rvProject: { externallyManaged: true },
      boardDts: {
        chosen: { "zephyrcode-rv32-partition": "&rv32_partition" },
      },
    });
    expect(overlay).to.include(
      "/delete-property/ zephyr,code-rv32-partition;",
      "Overlay should delete the code-rv32-partition chosen property for an externally managed RV project",
    );
  });

  it("does not delete the code-rv32-partition chosen property when the RV project is not externally managed", async () => {
    // Same board chosen property, but a non-externally-managed RV project must
    // leave the code-rv32-partition property in place.
    const overlay = await generateMax32690OverlayWithBoardDts({
      rvProject: { externallyManaged: false },
      boardDts: {
        chosen: { "zephyrcode-rv32-partition": "&rv32_partition" },
      },
    });
    expect(overlay).to.not.include(
      "/delete-property/ zephyr,code-rv32-partition;",
      "Overlay should not delete the code-rv32-partition chosen property when the RV project is not externally managed",
    );
  });

  describe("emits config-gated code-generation outputs", () => {
    const AIMODELS_BASENAME = "aimodels.cmake";
    const DFG_CONFIG_BASENAME = "dfg_config.h";

    // buildMockCfsConfig() names its single project "m4", so generated files
    // land under `<basePath>/m4/<dst>`.
    const generatedPath = (relative: string): string =>
      joinPath(codeGenBasePath, "m4", relative);

    async function generateFor(config: CfsConfig): Promise<string[]> {
      const socData = JSON.parse(
        await fs.readFile(path.resolve(SOC_DATA_MODEL_WLP), "utf-8"),
      ) as CfsSocDataModel;

      const context: CfsCodeGenerationContext = {
        cfsconfig: config,
        datamodel: socData,
        projectId: "CM4",
        coreId: "CM4",
      };

      return projectPlugin.generateCode(context, codeGenBasePath);
    }

    it("omits aimodels.cmake when the project declares no AI models", async () => {
      const filesGenerated = await generateFor(buildMockCfsConfig());

      expect(
        filesGenerated.some((file) => file.endsWith(AIMODELS_BASENAME)),
        "aimodels.cmake should not be reported without AI models",
      ).to.be.false;
      expect(await fileExists(generatedPath(AIMODELS_BASENAME))).to.be.false;
    });

    it("emits aimodels.cmake when the project declares an AI model", async () => {
      const config = buildMockCfsConfig();
      config.Projects[0].AIModels = [
        {
          Name: "test-model",
          Enabled: true,
          Files: {},
          OutDir: "models",
          Target: { Core: "CM4" },
          Backend: { Name: "tflm" },
        },
      ];

      const filesGenerated = await generateFor(config);
      const aimodelsPath = generatedPath(AIMODELS_BASENAME);

      expect(
        filesGenerated.some((file) => file.endsWith(AIMODELS_BASENAME)),
        "generateCode should report aimodels.cmake when AI models exist",
      ).to.be.true;
      expect(await fileExists(aimodelsPath), `${aimodelsPath} should exist`).to
        .be.true;

      const content = await fs.readFile(aimodelsPath, "utf-8");
      expect(content).to.include(
        "CMake rules for any AI Models within project",
        "aimodels.cmake should render the AI-models section",
      );
      expect(content).to.include(
        "src/adi_tflm",
        "the tflm backend should pull in the ADI TFLM sources",
      );
    });

    it("omits src/dfg_config.h when the system config declares no DFG streams", async () => {
      const filesGenerated = await generateFor(buildMockCfsConfig());

      expect(
        filesGenerated.some((file) => file.endsWith(DFG_CONFIG_BASENAME)),
        "dfg_config.h should not be reported without DFG streams",
      ).to.be.false;
      expect(await fileExists(generatedPath(`src/${DFG_CONFIG_BASENAME}`))).to
        .be.false;
    });

    // The positive dfg_config.h path (streams present -> file emitted) is not
    // covered here. dfg_config.h.eta renders purely from cfsconfig.DFG.Streams,
    // but generateCode renders every project template in one pass, and
    // project.overlay.eta iterates it.datamodel.Gaskets whenever a DFG stream
    // belongs to the project. The checked-in MAX32690 models have no Gaskets
    // (it is not a dataflow-gasket part), so exercising the emit branch needs a
    // DFG-capable SoC data model, which is not among the checked-in models. The
    // positive branch stays deferred until such a model is available; forcing a
    // synthetic MAX32690+DFG model here would test a combination that cannot
    // occur. The omitted branch above is covered now.
  });
});
