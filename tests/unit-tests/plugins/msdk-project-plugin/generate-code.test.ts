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
} from "cfs-types";
import MsdkProjectPlugin from "@plugins/msdk-project-plugin/index.js";
import {
  fileExists,
  isDebug,
  loadPluginInfoSync,
} from "@utilities/test-utilities.js";
import { joinPath } from "@utilities/path-utilities.js";
import { validateJsonFile } from "@utilities/validate-json.js";

const PROJECT_MANIFEST = "plugins/dist/msdk-project-plugin/.cfsplugin";

const DATA_DIR = "tests/unit-tests/plugins/msdk-project-plugin/data";
const WORKSPACE_NAME = "test-workspace";

const SOC_DATA_MODEL_TQFN = "tests/unit-tests/soc/max32690-tqfn.json";
const SOC_DATA_MODEL_MAX32666 = "tests/unit-tests/soc/max32666-ctbga.json";
const SOC_DATA_MODEL_MAX32657 = "tests/unit-tests/soc/max32657-wlp.json";

function buildMockCfsConfig(): CfsConfig {
  return {
    Copyright:
      "Copyright (c) 2024 Analog Devices, Inc.  All rights reserved. This software is proprietary to Analog Devices, Inc. and its licensors.",
    SchemaVersion: "2.1.0",
    DataModelVersion: "0.0.25",
    Soc: "MAX32690",
    Package: "TQFN",
    Pins: [],
    ClockNodes: [],
    Timestamp: new Date().toISOString(),
    BoardName: "EvKit_V1",
    Projects: [
      {
        CoreId: "CM4",
        ProjectId: "CM4",
        PluginId: "com.analog.project.msdk.plugin",
        PluginVersion: "1.0.0",
        FirmwarePlatform: "msdk",
        ExternallyManaged: false,
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
          Cflags: "",
        },
        Peripherals: [{ Name: "Name", Signals: [], Config: {} }],
      },
    ],
  };
}

describe("MSDK project plugin - generateCode", () => {
  const codeGenBasePath = `${DATA_DIR}/${WORKSPACE_NAME}`;
  const projectPluginInfo: CfsPluginInfo = loadPluginInfoSync(PROJECT_MANIFEST);
  let projectPlugin: MsdkProjectPlugin;

  beforeEach(() => {
    projectPlugin = new MsdkProjectPlugin(projectPluginInfo);
  });

  afterEach(async () => {
    if (!isDebug()) {
      await fs.rm(DATA_DIR, { recursive: true, force: true });
    }
  });

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
    const socPath = path.resolve(SOC_DATA_MODEL_TQFN);
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

  it("generates CM4 soc_init and config files", async () => {
    const cfsConfig = buildMockCfsConfig();
    const socPath = path.resolve(SOC_DATA_MODEL_TQFN);
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

    const projectName =
      cfsConfig.Projects.find((project) => project.ProjectId === "CM4")
        ?.PlatformConfig.ProjectName ?? "";

    const expectedFiles = [
      "soc_init.c",
      "soc_init.h",
      "config.mk",
      "memory.ld",
    ];

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
      `Expected files: ${expectedFiles.join(", ")} are not found in generated files: ${filesGenerated.join(", ")}`,
    ).to.be.true;
  });

  it("generates RV core code with correct memory layout", async () => {
    const socPath = path.resolve(SOC_DATA_MODEL_TQFN);
    const socData = JSON.parse(
      await fs.readFile(socPath, "utf-8"),
    ) as CfsSocDataModel;

    const rvCfsConfig: CfsConfig = {
      ...buildMockCfsConfig(),
      Projects: [
        {
          CoreId: "RV",
          ProjectId: "RV",
          PluginId: "com.analog.project.msdk.plugin",
          PluginVersion: "1.0.0",
          FirmwarePlatform: "msdk",
          ExternallyManaged: false,
          Partitions: [
            {
              Name: "RISCV_FLASH",
              StartAddress: "0x10300000",
              Size: 262144,
              IsOwner: true,
              Access: "R/W",
              Config: { NAME_OVERRIDE: "FLASH" },
            },
            {
              Name: "RISCV_SRAM",
              StartAddress: "0x20100000",
              Size: 131072,
              IsOwner: true,
              Access: "R/W",
              Config: { NAME_OVERRIDE: "SRAM" },
            },
          ],
          PlatformConfig: {
            ProjectName: "riscv",
            Cflags: "",
          },
          Peripherals: [{ Name: "RV mtime", Signals: [], Config: {} }],
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

    const projectName = "riscv";
    const expectedFiles = [
      "soc_init.c",
      "soc_init.h",
      "config.mk",
      "memory.ld",
    ];

    for (const file of expectedFiles) {
      const filePath = joinPath(codeGenBasePath, projectName, file);
      expect(
        await fileExists(filePath),
        `File ${file} should exist in the RV project directory`,
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
      "RV core code generation should report the generated files",
    ).to.be.true;

    const memoryLdPath = joinPath(codeGenBasePath, projectName, "memory.ld");
    const memoryLdContent = await fs.readFile(memoryLdPath, "utf-8");

    expect(memoryLdContent).to.match(
      /^\s*FLASH\s+\(rw\)\s*:\s*ORIGIN = 0x10300000,\s*LENGTH = 0x00040000/m,
      "RV FLASH region should contain the configured origin and length",
    );
    expect(memoryLdContent).to.match(
      /^\s*SRAM\s+\(rw\)\s*:\s*ORIGIN = 0x20100000,\s*LENGTH = 0x00020000/m,
      "RV SRAM region should contain the configured origin and length",
    );
  });

  describe("emits config-gated code-generation outputs", () => {
    const AIMODELS_BASENAME = "aimodels.mk";

    const generatedPath = (relative: string): string =>
      joinPath(codeGenBasePath, "m4", relative);

    async function generateFor(config: CfsConfig): Promise<string[]> {
      const socData = JSON.parse(
        await fs.readFile(path.resolve(SOC_DATA_MODEL_TQFN), "utf-8"),
      ) as CfsSocDataModel;

      const context: CfsCodeGenerationContext = {
        cfsconfig: config,
        datamodel: socData,
        projectId: "CM4",
        coreId: "CM4",
      };

      return projectPlugin.generateCode(context, codeGenBasePath);
    }

    it("omits aimodels.mk when the project declares no AI models", async () => {
      const filesGenerated = await generateFor(buildMockCfsConfig());

      expect(
        filesGenerated.some((file) => file.endsWith(AIMODELS_BASENAME)),
        "aimodels.mk should not be reported without AI models",
      ).to.be.false;
      expect(await fileExists(generatedPath(AIMODELS_BASENAME))).to.be.false;
    });

    it("emits aimodels.mk when the project declares an AI model", async () => {
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
        "generateCode should report aimodels.mk when AI models exist",
      ).to.be.true;
      expect(await fileExists(aimodelsPath), `${aimodelsPath} should exist`).to
        .be.true;

      const content = await fs.readFile(aimodelsPath, "utf-8");
      expect(content).to.include(
        "CMake rules for any AI Models within project",
        "aimodels.mk should render the AI-models section",
      );
      expect(content).to.include(
        "src/adi_tflm",
        "the tflm backend should pull in the ADI TFLM sources",
      );
    });
  });

  describe("generates secure build outputs (MAX32657 CM33)", () => {
    function buildSecureCfsConfig(): CfsConfig {
      return {
        Copyright:
          "Copyright (c) 2024 Analog Devices, Inc.  All rights reserved.",
        SchemaVersion: "2.1.0",
        DataModelVersion: "0.0.25",
        Soc: "MAX32657",
        Package: "WLP",
        Pins: [],
        ClockNodes: [],
        Timestamp: new Date().toISOString(),
        BoardName: "EvKit_V1",
        Projects: [
          {
            CoreId: "CM33",
            ProjectId: "CM33",
            PluginId: "com.analog.project.msdk.plugin",
            PluginVersion: "1.0.0",
            FirmwarePlatform: "msdk",
            ExternallyManaged: false,
            Secure: true,
            Partitions: [
              {
                Name: "secure_code_ram",
                StartAddress: "0x20000000",
                Size: 8192,
                IsOwner: true,
                Access: "R/W",
                Config: {},
              },
              {
                Name: "BL2",
                StartAddress: "0x1000000",
                Size: 65536,
                IsOwner: true,
                Access: "R/W",
                Config: {},
              },
              {
                Name: "secure_flash",
                StartAddress: "0x1010000",
                Size: 131072,
                IsOwner: true,
                Access: "R/W",
                Config: {},
              },
              {
                Name: "slot0_ns_partition",
                StartAddress: "0x1030000",
                Size: 524288,
                IsOwner: true,
                Access: "R/W",
                Config: {},
              },
              {
                Name: "PS",
                StartAddress: "0x10B0000",
                Size: 16384,
                IsOwner: true,
                Access: "R/W",
                Config: {},
              },
              {
                Name: "ITS",
                StartAddress: "0x10B4000",
                Size: 8192,
                IsOwner: true,
                Access: "R/W",
                Config: {},
              },
            ],
            PlatformConfig: {
              ProjectName: "m33",
              Cflags: "",
            },
            Peripherals: [
              { Name: "GCR", Signals: [], Config: {} },
              { Name: "UART0", Signals: [], Config: {} },
              { Name: "TRNG", Signals: [], Config: {} },
            ],
          },
        ],
      };
    }

    async function generateSecure(): Promise<string[]> {
      const socData = JSON.parse(
        await fs.readFile(path.resolve(SOC_DATA_MODEL_MAX32657), "utf-8"),
      ) as CfsSocDataModel;

      const context: CfsCodeGenerationContext = {
        cfsconfig: buildSecureCfsConfig(),
        datamodel: socData,
        projectId: "CM33",
        coreId: "CM33",
      };

      return projectPlugin.generateCode(context, codeGenBasePath);
    }

    it("emits adi_soc_peripheral_init.c and .h instead of soc_init.*", async () => {
      const filesGenerated = await generateSecure();
      const projectName = "m33";

      for (const file of [
        "adi_soc_peripheral_init.c",
        "adi_soc_peripheral_init.h",
      ]) {
        const filePath = joinPath(codeGenBasePath, projectName, file);
        expect(await fileExists(filePath), `Secure output ${file} should exist`)
          .to.be.true;
        expect(
          filesGenerated.some((f) => path.basename(f) === file),
          `${file} should be reported in generated files`,
        ).to.be.true;
      }

      for (const file of ["soc_init.c", "soc_init.h"]) {
        expect(
          filesGenerated.some((f) => path.basename(f) === file),
          `Non-secure ${file} should not be reported for a secure build`,
        ).to.be.false;
      }
    });

    it("emits s_ns_access_overlay.cmake with correct peripheral, SRAM, and partition values", async () => {
      const filesGenerated = await generateSecure();
      const overlayPath = joinPath(
        codeGenBasePath,
        "m33",
        "s_ns_access_overlay.cmake",
      );

      expect(
        filesGenerated.some((f) => f.endsWith("s_ns_access_overlay.cmake")),
        "s_ns_access_overlay.cmake should be reported for a secure build",
      ).to.be.true;
      expect(
        await fileExists(overlayPath),
        "s_ns_access_overlay.cmake should exist on disk",
      ).to.be.true;

      const overlayContent = await fs.readFile(overlayPath, "utf-8");

      function cmakeVar(name: string): string {
        const match = new RegExp(
          `set\\(${name}\\s+"?([^"\\s)]+)"?\\s*\\)`,
        ).exec(overlayContent);
        if (!match) {
          expect.fail(`${name} should be present in the overlay`);
        }
        return match[1];
      }

      expect(
        cmakeVar("ADI_NS_PRPH_GCR"),
        "GCR is in the secure project's Peripherals → non-secure = OFF",
      ).to.equal("OFF");
      expect(
        cmakeVar("ADI_NS_PRPH_UART"),
        "UART0 is in the secure project's Peripherals → non-secure = OFF",
      ).to.equal("OFF");
      expect(
        cmakeVar("ADI_NS_PRPH_TRNG"),
        "TRNG is in the secure project's Peripherals → non-secure = OFF",
      ).to.equal("OFF");
      expect(
        cmakeVar("ADI_NS_PRPH_CRC"),
        "CRC is NOT in the secure project's Peripherals → non-secure = ON",
      ).to.equal("ON");
      expect(
        cmakeVar("ADI_NS_PRPH_SPI"),
        "SPI0 is NOT in the secure project's Peripherals → non-secure = ON",
      ).to.equal("ON");

      expect(
        cmakeVar("ADI_NS_SRAM_0"),
        "sysram0 overlaps a secure partition → non-secure = OFF",
      ).to.equal("OFF");
      expect(
        cmakeVar("ADI_NS_SRAM_4"),
        "sysram4 has no overlapping secure partition → non-secure = ON",
      ).to.equal("ON");

      expect(
        cmakeVar("ADI_S_RAM_CODE_SIZE"),
        "secure_code_ram partition size = 8192 = 0x2000",
      ).to.equal("0x2000");
      expect(
        cmakeVar("ADI_FLASH_AREA_BL2_SIZE"),
        "BL2 partition size = 65536 = 0x10000",
      ).to.equal("0x10000");
      expect(
        cmakeVar("ADI_FLASH_S_PARTITION_SIZE"),
        "secure_flash partition size = 131072 = 0x20000",
      ).to.equal("0x20000");
      expect(
        cmakeVar("ADI_FLASH_NS_PARTITION_SIZE"),
        "slot0_ns_partition size = 524288 = 0x80000",
      ).to.equal("0x80000");
      expect(
        cmakeVar("ADI_FLASH_PS_AREA_SIZE"),
        "PS partition size = 16384 = 0x4000",
      ).to.equal("0x4000");
      expect(
        cmakeVar("ADI_FLASH_ITS_AREA_SIZE"),
        "ITS partition size = 8192 = 0x2000",
      ).to.equal("0x2000");
    });

    it("omits config.mk and memory.ld for secure builds", async () => {
      const filesGenerated = await generateSecure();

      for (const file of ["config.mk", "memory.ld"]) {
        expect(
          filesGenerated.some((f) => path.basename(f) === file),
          `${file} should not be reported for a secure build`,
        ).to.be.false;
        expect(
          await fileExists(joinPath(codeGenBasePath, "m33", file)),
          `${file} should not exist on disk for a secure build`,
        ).to.be.false;
      }
    });
  });

  describe("generates MAX32666 CM4-1 outputs", () => {
    function buildMax32666Cm41Config(): CfsConfig {
      return {
        Copyright:
          "Copyright (c) 2024 Analog Devices, Inc.  All rights reserved.",
        SchemaVersion: "2.1.0",
        DataModelVersion: "0.0.25",
        Soc: "MAX32666",
        Package: "CTBGA",
        Pins: [],
        ClockNodes: [],
        Timestamp: new Date().toISOString(),
        BoardName: "EvKit_V1",
        Projects: [
          {
            CoreId: "CM4-1",
            ProjectId: "CM4-1",
            PluginId: "com.analog.project.msdk.plugin",
            PluginVersion: "1.0.0",
            FirmwarePlatform: "msdk",
            ExternallyManaged: false,
            Partitions: [
              {
                Name: "Name",
                StartAddress: "0x20000000",
                Size: 2048,
                IsOwner: false,
                Access: "R/W",
                Config: {},
              },
            ],
            PlatformConfig: {
              ProjectName: "core1",
              Cflags: "",
            },
            Peripherals: [{ Name: "Name", Signals: [], Config: {} }],
          },
        ],
      };
    }

    async function generateCm41(): Promise<string[]> {
      const socData = JSON.parse(
        await fs.readFile(path.resolve(SOC_DATA_MODEL_MAX32666), "utf-8"),
      ) as CfsSocDataModel;

      const context: CfsCodeGenerationContext = {
        cfsconfig: buildMax32666Cm41Config(),
        datamodel: socData,
        projectId: "CM4-1",
        coreId: "CM4-1",
      };

      return projectPlugin.generateCode(context, codeGenBasePath);
    }

    it("emits soc_init_core1.c and .h instead of soc_init.*", async () => {
      const filesGenerated = await generateCm41();
      const projectName = "core1";

      for (const file of ["soc_init_core1.c", "soc_init_core1.h"]) {
        const filePath = joinPath(codeGenBasePath, projectName, file);
        expect(await fileExists(filePath), `CM4-1 output ${file} should exist`)
          .to.be.true;
        expect(
          filesGenerated.some((f) => path.basename(f) === file),
          `${file} should be reported in generated files`,
        ).to.be.true;
      }

      for (const file of ["soc_init.c", "soc_init.h"]) {
        expect(
          filesGenerated.some((f) => path.basename(f) === file),
          `Default ${file} should not be reported for CM4-1`,
        ).to.be.false;
      }
    });

    it("omits config.mk and memory.ld for CM4-1", async () => {
      const filesGenerated = await generateCm41();

      for (const file of ["config.mk", "memory.ld"]) {
        expect(
          filesGenerated.some((f) => path.basename(f) === file),
          `${file} should not be reported for MAX32666 CM4-1`,
        ).to.be.false;
        expect(
          await fileExists(joinPath(codeGenBasePath, "core1", file)),
          `${file} should not exist on disk for MAX32666 CM4-1`,
        ).to.be.false;
      }
    });

    it("does not emit s_ns_access_overlay.cmake without Secure flag", async () => {
      const filesGenerated = await generateCm41();

      expect(
        filesGenerated.some((f) => f.endsWith("s_ns_access_overlay.cmake")),
        "s_ns_access_overlay.cmake should not appear for non-secure CM4-1",
      ).to.be.false;
    });
  });

  describe("generates MAX32666 CM4-0 outputs", () => {
    function buildMax32666Cm40Config(): CfsConfig {
      return {
        Copyright:
          "Copyright (c) 2024 Analog Devices, Inc.  All rights reserved.",
        SchemaVersion: "2.1.0",
        DataModelVersion: "0.0.25",
        Soc: "MAX32666",
        Package: "CTBGA",
        Pins: [],
        ClockNodes: [],
        Timestamp: new Date().toISOString(),
        BoardName: "EvKit_V1",
        Projects: [
          {
            CoreId: "CM4-0",
            ProjectId: "CM4-0",
            PluginId: "com.analog.project.msdk.plugin",
            PluginVersion: "1.0.0",
            FirmwarePlatform: "msdk",
            ExternallyManaged: false,
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
              Cflags: "",
            },
            Peripherals: [{ Name: "Name", Signals: [], Config: {} }],
          },
        ],
      };
    }

    async function generateCm40(): Promise<string[]> {
      const socData = JSON.parse(
        await fs.readFile(path.resolve(SOC_DATA_MODEL_MAX32666), "utf-8"),
      ) as CfsSocDataModel;

      const context: CfsCodeGenerationContext = {
        cfsconfig: buildMax32666Cm40Config(),
        datamodel: socData,
        projectId: "CM4-0",
        coreId: "CM4-0",
      };

      return projectPlugin.generateCode(context, codeGenBasePath);
    }

    it("emits config.mk and memory.ld for non-secure CM4-0", async () => {
      const filesGenerated = await generateCm40();

      for (const file of ["config.mk", "memory.ld"]) {
        expect(
          filesGenerated.some((f) => path.basename(f) === file),
          `${file} should be reported for MAX32666 CM4-0`,
        ).to.be.true;
        expect(
          await fileExists(joinPath(codeGenBasePath, "m4", file)),
          `${file} should exist on disk for MAX32666 CM4-0`,
        ).to.be.true;
      }
    });
  });
});
