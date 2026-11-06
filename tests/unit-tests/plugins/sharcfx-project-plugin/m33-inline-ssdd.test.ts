/**
 * Copyright (c) 2026 Analog Devices, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { expect } from "chai";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { CfsPluginInfo } from "cfs-types";
import SharcFxProjectPlugin from "@plugins/sharcfx-project-plugin/index.js";

describe("SHARC-FX inline M33 SSDD config", () => {
  let baseDir: string;
  let plugin: SharcFxProjectPlugin;

  beforeEach(async () => {
    baseDir = await mkdtemp(path.join(os.tmpdir(), "cfs-m33-ssdd-"));
    const manifestPath = path.resolve(
      "plugins/dist/sharcfx-project-plugin/.cfsplugin",
    );
    const pluginInfo = JSON.parse(
      await readFile(manifestPath, "utf8"),
    ) as CfsPluginInfo;
    pluginInfo.pluginPath = manifestPath;
    const codegen = pluginInfo.features.codegen;
    codegen.files = [];
    codegen.templates = codegen.templates.filter(
      (template) =>
        template.src === "templates/config.mk.eta" ||
        template.src.startsWith("templates/ssdd/"),
    );
    plugin = new SharcFxProjectPlugin(pluginInfo);
  });

  afterEach(async () => {
    if (process.env.CFS_TEST_DEBUG !== "1") {
      await rm(baseDir, { recursive: true, force: true });
    }
  });

  const generate = async (
    names: string[],
    coreId = "M33",
    modelNames = names,
    modelCoreNames = [coreId === "M33" ? "CM33" : coreId],
  ) => {
    await plugin.generateCode(
      {
        coreId,
        projectId: "test-project",
        copyrightDate: "2026",
        datamodel: {
          Peripherals: modelNames.map((Name) => ({
            Name,
            Cores: modelCoreNames,
          })),
        },
        cfsconfig: {
          Projects: [
            {
              ProjectId: "test-project",
              CoreId: coreId,
              PlatformConfig: { ProjectName: "project" },
              Peripherals: names.map((Name) => ({
                Name,
                Signals: [],
                Config: {},
              })),
            },
          ],
        },
      },
      baseDir,
    );
    return readFile(path.join(baseDir, "project", "config.mk"), "utf8");
  };

  it("emits the PDMA dependency without an implicit PDMA config header", async () => {
    const content = await generate(["LP0"]);
    expect(content).to.include(
      "# Shared M33 interrupt and dispatch runtime support; included automatically for SSDD projects.",
    );
    for (const source of [
      "$(SSDD_DRIVER_BASE)/linkport/adi_linkport.c",
      "$(SSDD_SERVICE_BASE)/pdma/adi_pdma.c",
      "$(SSDD_SERVICE_BASE)/int/adi_int.c",
      "$(SSDD_SERVICE_BASE)/int/adi_nvic_v1.c",
      "$(SSDD_BASE)/runtime/int/adi_rtl_register_dispatched_handler.c",
      "$(SSDD_BASE)/runtime/osal/cortex-m33/adi_osal_arch_c.c",
    ]) {
      expect(content).to.include(`SSDD_C_SRCS += ${source}`);
    }
    expect(content).to.not.include("runtime/addr/translate_");
    expect(content).to.include(
      "EXTERNAL_INCLUDE_DIRS += $(SSDD_BASE)/../Include/runtime/osal",
    );
    expect(
      existsSync(
        path.join(baseDir, "project/include/ssdd/adi_pdma_config_SC8xx.h"),
      ),
    ).to.equal(false);
  });

  it("resolves lettered PORT allocations to GPIO source and include paths", async () => {
    const content = await generate(["PORTA"]);
    expect(content).to.include(
      "SSDD_C_SRCS += $(SSDD_SERVICE_BASE)/gpio/adi_gpio.c",
    );
    expect(content).to.include(
      "EXTERNAL_INCLUDE_DIRS += $(sort $(dir $(SSDD_C_SRCS)))",
    );
  });

  it("validates allocated peripheral names independently of model core labels", async () => {
    const content = await generate(["CANFD0"], "M33", ["CANFD0"], ["SHARC"]);
    expect(content).to.include(
      "SSDD_C_SRCS += $(SSDD_DRIVER_BASE)/canfd/adi_canfd.c",
    );
  });

  it("searches shipped config-header directories after local overrides", async () => {
    const content = await generate(["CANFD0"]);
    const localIncludes = content.indexOf(
      "EXTERNAL_INCLUDE_DIRS += include/ssdd",
    );
    expect(localIncludes).to.be.greaterThanOrEqual(0);

    const dependencyDirectories = [
      "services/dma",
      "services/pdma",
      "services/pwr",
      "services/tru",
      "services/pkic",
    ];
    for (const directory of dependencyDirectories) {
      const packInclude = content.indexOf(
        `EXTERNAL_INCLUDE_DIRS += $(SSDD_BASE)/../Include/${directory}`,
      );
      expect(
        packInclude,
        `missing pack include directory ${directory}`,
      ).to.be.greaterThan(localIncludes);
    }

    for (const directory of [
      "drivers/asrc",
      "drivers/canfd",
      "drivers/rotary",
      "drivers/crc",
      "drivers/mlb",
      "services/pdm",
      "drivers/spdif",
      "drivers/spi",
      "drivers/sport",
      "services/swu",
      "services/tmr",
      "drivers/crypto",
      "drivers/twi",
      "drivers/uart",
      "drivers/xspi",
    ]) {
      expect(content).not.to.include(
        `EXTERNAL_INCLUDE_DIRS += $(SSDD_BASE)/../Include/${directory}\n`,
      );
    }
  });

  it("supports DMA allocations above the SDK helper's numeric scan range", async () => {
    const content = await generate(["DMA52"]);
    expect(content).to.include(
      "SSDD_C_SRCS += $(SSDD_SERVICE_BASE)/pdma/adi_pdma.c",
    );
    expect(
      await readFile(
        path.join(baseDir, "project/include/ssdd/adi_pdma_config_SC8xx.h"),
        "utf8",
      ),
    ).to.include("#define ADI_PDMA_LISTDESCRIPTOR");
  });

  it("deduplicates CANFD and CRC sources without generating the MDMA config header", async () => {
    const content = await generate(["CANFD0", "CRC0", "TRU0"]);
    const sourceCount = (source: string) =>
      content.split(`SSDD_C_SRCS += ${source}`).length - 1;

    expect(sourceCount("$(SSDD_SERVICE_BASE)/dma/adi_dma.c")).to.equal(1);
    expect(sourceCount("$(SSDD_SERVICE_BASE)/pwr/adi_pwr.c")).to.equal(1);
    expect(sourceCount("$(SSDD_SERVICE_BASE)/tru/adi_tru.c")).to.equal(1);
    expect(content).to.not.include("SSDD_C_SRCS := $(sort $(SSDD_C_SRCS))");
    for (const header of [
      "adi_canfd_config_SC8xx.h",
      "adi_crc_config_SC8xx.h",
    ]) {
      expect(
        await readFile(
          path.join(baseDir, "project/include/ssdd", header),
          "utf8",
        ),
      ).to.not.equal("");
    }
    expect(
      existsSync(
        path.join(baseDir, "project/include/ssdd/adi_mdma_config_SC8xx.h"),
      ),
    ).to.equal(false);
  });

  it("emits shared PDMA and PKIC services once for multiple consumers", async () => {
    let content = await generate(["LP0", "SPI0", "SPORT0", "UART0", "DMA52"]);
    expect(
      content.split("SSDD_C_SRCS += $(SSDD_SERVICE_BASE)/pdma/adi_pdma.c")
        .length - 1,
    ).to.equal(1);

    content = await generate(["DMA0"]);
    expect(
      content.split("SSDD_C_SRCS += $(SSDD_SERVICE_BASE)/pdma/adi_pdma.c")
        .length - 1,
    ).to.equal(1);

    content = await generate(["PKA0", "TRNG0"]);
    expect(
      content.split("SSDD_C_SRCS += $(SSDD_SERVICE_BASE)/pkic/adi_pkic.c")
        .length - 1,
    ).to.equal(1);
  });

  it("keeps FX source selection and FX headers intact", async () => {
    const content = await generate(["CANFD0"], "FX");
    expect(content).to.include("SSDD_DRIVER_BASE)/canfd/adi_canfd.c");
    expect(content).to.not.include("runtime/osal/cortex-m33");
    expect(
      await readFile(
        path.join(
          baseDir,
          "project/include/ssdd/drivers/canfd/adi_canfd_config_SC8xx.h",
        ),
        "utf8",
      ),
    ).to.not.equal("");
  });

  it("preserves SDK allocation matching semantics for FX", async () => {
    const content = await generate(["CANFD0", "UARTA"], "FX");

    expect(content).to.include(
      "SSDD_C_SRCS += $(SSDD_DRIVER_BASE)/canfd/adi_canfd.c",
    );
    expect(content).to.not.include(
      "SSDD_C_SRCS += $(SSDD_DRIVER_BASE)/uart/adi_uart.c",
    );
  });

  const headerCases: [string, string[]][] = [
    ["ASRC0", ["adi_asrc_config_SC8xx.h"]],
    ["CANFD0", ["adi_canfd_config_SC8xx.h"]],
    ["CNT0", ["adi_counter_config_SC8xx.h"]],
    ["CRC0", ["adi_crc_config_SC8xx.h"]],
    ["EMDMA0", ["adi_mdma_config_SC8xx.h"]],
    ["MLB0", ["adi_mlb_config_SC8xx.h"]],
    ["PDM0", ["adi_pdm_config_SC8xx.h"]],
    ["DMA52", ["adi_pdma_config_SC8xx.h"]],
    ["SPDIF0", ["adi_spdif_rx_config_SC8xx.h", "adi_spdif_tx_config_SC8xx.h"]],
    ["SPI0", ["adi_spi_config_SC8xx.h"]],
    ["SPORT0", ["adi_sport_config_SC8xx.h"]],
    ["SWU0", ["adi_swu_config_SC8xx.h"]],
    ["TIMER0", ["adi_tmr_config_SC8xx.h"]],
    ["TRNG0", ["adi_trng_config_SC8xx.h"]],
    ["TWI0", ["adi_twi_config_SC8xx.h"]],
    ["UART0", ["adi_uart_config_SC8xx.h"]],
    ["XSPI0", ["adi_xspi_config_SC8xx.h"]],
  ];

  for (const [name, headers] of headerCases) {
    it(`generates every required configuration header for ${name}`, async () => {
      await generate([name]);
      for (const header of headers) {
        expect(
          await readFile(
            path.join(baseDir, "project/include/ssdd", header),
            "utf8",
          ),
        ).to.not.equal("");
      }
    });
  }

  const familySourceCases: [string, string[]][] = [
    ["ASRC", ["$(SSDD_DRIVER_BASE)/asrc/adi_asrc.c"]],
    ["CANFD", ["$(SSDD_DRIVER_BASE)/canfd/adi_canfd.c"]],
    ["CNT", ["$(SSDD_DRIVER_BASE)/rotary/adi_counter.c"]],
    ["CRC", ["$(SSDD_DRIVER_BASE)/crc/adi_crc.c"]],
    ["DAI", ["$(SSDD_SERVICE_BASE)/dai/adi_dai.c"]],
    ["DMA", ["$(SSDD_SERVICE_BASE)/pdma/adi_pdma.c"]],
    ["DMCPM", ["$(SSDD_SERVICE_BASE)/dmcpm/adi_dmcpm.c"]],
    ["EMAC", ["$(SSDD_DRIVER_BASE)/ethernet/emac/adi_emac.c"]],
    ["EMDMA", ["$(SSDD_SERVICE_BASE)/dma/adi_dma.c"]],
    ["FRACNPLL", ["$(SSDD_SERVICE_BASE)/fpll/adi_fpll.c"]],
    ["HADC", ["$(SSDD_DRIVER_BASE)/hadc/adi_hadc.c"]],
    ["L2CTL", ["$(SSDD_SERVICE_BASE)/l2ctl/adi_l2ctl.c"]],
    ["LP", ["$(SSDD_DRIVER_BASE)/linkport/adi_linkport.c"]],
    ["MEPU", ["$(SSDD_SERVICE_BASE)/mepu/adi_mepu.c"]],
    ["MLB", ["$(SSDD_DRIVER_BASE)/mlb/adi_mlb.c"]],
    ["PCG", ["$(SSDD_SERVICE_BASE)/pcg/adi_pcg.c"]],
    ["PDM", ["$(SSDD_SERVICE_BASE)/pdm/adi_pdm.c"]],
    ["PDMA", ["$(SSDD_SERVICE_BASE)/pdma/adi_pdma.c"]],
    ["PKA", ["$(SSDD_DRIVER_BASE)/crypto/adi_pka.c"]],
    ["PKIC", ["$(SSDD_SERVICE_BASE)/pkic/adi_pkic.c"]],
    ["PKTE", ["$(SSDD_DRIVER_BASE)/crypto/adi_pkte.c"]],
    ["PORT", ["$(SSDD_SERVICE_BASE)/gpio/adi_gpio.c"]],
    ["PWM", ["$(SSDD_SERVICE_BASE)/pwm/adi_pwm.c"]],
    ["PWR", ["$(SSDD_SERVICE_BASE)/pwr/adi_pwr.c"]],
    ["RCU", ["$(SSDD_SERVICE_BASE)/rcu/adi_rcu.c"]],
    ["SMPU", ["$(SSDD_SERVICE_BASE)/smpu/adi_smpu.c"]],
    [
      "SPDIF",
      [
        "$(SSDD_DRIVER_BASE)/spdif/adi_spdif_rx.c",
        "$(SSDD_DRIVER_BASE)/spdif/adi_spdif_tx.c",
      ],
    ],
    ["SPI", ["$(SSDD_DRIVER_BASE)/spi/adi_spi.c"]],
    ["SPORT", ["$(SSDD_DRIVER_BASE)/sport/adi_sport.c"]],
    ["SPU", ["$(SSDD_SERVICE_BASE)/spu/adi_spu.c"]],
    ["SWU", ["$(SSDD_SERVICE_BASE)/swu/adi_swu.c"]],
    ["TIMER", ["$(SSDD_SERVICE_BASE)/tmr/adi_tmr.c"]],
    ["TMU", ["$(SSDD_DRIVER_BASE)/tmu/adi_tmu.c"]],
    ["TRNG", ["$(SSDD_DRIVER_BASE)/crypto/adi_trng.c"]],
    ["TRU", ["$(SSDD_SERVICE_BASE)/tru/adi_tru.c"]],
    ["TWI", ["$(SSDD_DRIVER_BASE)/twi/adi_twi.c"]],
    ["UART", ["$(SSDD_DRIVER_BASE)/uart/adi_uart.c"]],
    ["WDOG", ["$(SSDD_SERVICE_BASE)/wd/adi_wd.c"]],
    ["XSPI", ["$(SSDD_DRIVER_BASE)/xspi/adi_xspi.c"]],
  ];

  for (const [prefix, expectedSources] of familySourceCases) {
    it(`maps ${prefix} allocations to their SSDD sources`, async () => {
      const content = await generate([`${prefix}0`]);
      const sourceLines = content
        .split(/\r?\n/)
        .filter((line) => line.startsWith("SSDD_C_SRCS += "));

      for (const source of expectedSources) {
        expect(sourceLines, `${prefix} should include ${source}`).to.include(
          `SSDD_C_SRCS += ${source}`,
        );
      }
    });
  }
});
