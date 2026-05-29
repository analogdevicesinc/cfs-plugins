/**
 * Copyright (c) 2024-2026 Analog Devices, Inc.
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

if (it.cfsconfig.Package.toUpperCase() === "WLP") {

    peripheralData = [
    { zephyr: "adc", datamodel: "ADC", enable: "ENABLE",
      pins: [
          { signal: "AIN0", pin: "B11", name: "ain0n_p0_16"},
          { signal: "AIN3", pin: "C11", name: "ain1p_p0_19"},
          { signal: "AIN4", pin: "D10", name: "ain2n_p0_20"},
          { signal: "AIN1", pin: "D9", name: "ain0p_p0_17"},
          { signal: "AIN2", pin: "E9", name: "ain1n_p0_18"},
          { signal: "AIN5", pin: "F8", name: "ain2p_p0_21"},
          { signal: "AIN6", pin: "F9", name: "ain3n_p0_22"},
          { signal: "AIN7", pin: "G8", name: "ain3p_p0_23"}
      ]},
    { zephyr: "dma0", datamodel: "DMA0", enable: "DMA0_ENABLE"},
    { zephyr: "dma1", datamodel: "DMA1", enable: "DMA1_ENABLE"},
    { zephyr: "flc0", datamodel: "FLC0"},
    { zephyr: "flc1", datamodel: "FLC1"},
    { zephyr: "i2c0", datamodel: "I2C0", enable: "I2C0_ENABLE",
      pins: [
          { signal: "SCL", pin: "A8", name: "i2c0_scl_p0_6"},
          { signal: "SDA", pin: "B8", name: "i2c0_sda_p0_7"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { zephyr: "i2c1", datamodel: "I2C1", enable: "I2C1_ENABLE",
      pins: [
          { signal: "SCL", pin: "F5", name: "i2c1_scl_p0_14"},
          { signal: "SDA", pin: "G6", name: "i2c1_sda_p0_15"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { zephyr: "i2c2", datamodel: "I2C2", enable: "I2C2_ENABLE",
      pins: [
          { signal: "SCL", pin: "E4", name: "i2c2_scl_p1_14"},
          { signal: "SDA", pin: "G5", name: "i2c2_sda_p1_15"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { zephyr: "w1", datamodel: "OWM", enable: "ENABLE",
      pins: [
          { signal: "PE", pin: "A9", name: "owm_pe_p0_5"},
          { signal: "IO", pin: "B11", name: "owm_io_p0_16"},
          { signal: "IO", pin: "B9", name: "owm_io_p0_4"},
          { signal: "PE", pin: "D5", name: "owm_pe_p0_13"},
          { signal: "PE", pin: "D8", name: "owm_pe_p0_25"},
          { signal: "PE", pin: "D9", name: "owm_pe_p0_17"},
          { signal: "IO", pin: "E5", name: "owm_io_p0_12"},
          { signal: "IO", pin: "E8", name: "owm_io_p0_24"}
      ],
      config: [
          { name: "internal-pullup", type: "int", control: "INTERNAL_PULL_UP", cfg_default: "0",
            value: x => (x === "TRUE" ? "1" : "0")},
          { name: "external-pullup", type: "int", control: "EXTERNAL_PULL_UP", cfg_default: "2",
            value: x => (x === "TRUE" ? (getAssignedPeripheral("OWM").Config?.EXT_PULL_UP_MODE === "ACTIVE_LOW" ? "1" : "0") : "2")},
          { name: "long-line-mode", type: "boolean", control: "LONG_LINE_MODE", cfg_default: false,
            value: x => (x === "LONG")}
      ]},
    { zephyr: "rtc_counter", datamodel: "RTC"},
    //ZEPHYR-861
    /*{ zephyr: "sdhc0", datamodel: "SDHC", enable: "ENABLE",
      pins: [
          { signal: "DAT3", pin: "A1", name: "sdhc_dat3_p1_0"},
          { signal: "DAT0", pin: "A4", name: "sdhc_dat0_p1_2"},
          { signal: "DAT3", pin: "B2", name: "sdhc_dat3_p1_0"},
          { signal: "CMD", pin: "B3", name: "sdhc_cmd_p1_1"},
          { signal: "CLK", pin: "B4", name: "sdhc_clk_p1_3"},
          { signal: "CDN", pin: "C2", name: "sdhc_cdn_p1_7"},
          { signal: "WP", pin: "C3", name: "sdhc_wp_p1_6"},
          { signal: "DAT2", pin: "C4", name: "sdhc_dat2_p1_5"},
          { signal: "DAT1", pin: "C5", name: "sdhc_dat1_p1_4"}
      ]},*/
    { zephyr: "spi0", datamodel: "SPI0", enable: "ENABLE",
      pins: [
          { signal: "MOSI", pin: "D1", name: "spi0_mosi_p1_9"},
          { signal: "SCK", pin: "D2", name: "spi0_sck_p1_11"},
          { signal: "MISO", pin: "D3", name: "spi0_miso_p1_10"},
          { signal: "CS0", pin: "D4", name: "spi0_ss0_p1_8"},
          { signal: "SDIO3", pin: "D5", name: "spi0_sdio3_p0_13"},
          { signal: "SDIO2", pin: "E2", name: "spi0_sdio2_p1_12"},
          { signal: "SDIO3", pin: "E3", name: "spi0_sdio3_p1_13"},
          { signal: "SDIO2", pin: "E5", name: "spi0_sdio2_p0_12"},
          { signal: "MISO", pin: "E6", name: "spi0_miso_p0_10"},
          { signal: "CS1", pin: "F5", name: "spi0_ss1_p0_14"},
          { signal: "SCK", pin: "F6", name: "spi0_sck_p0_11"},
          { signal: "CS0", pin: "F7", name: "spi0_ss0_p0_8"},
          { signal: "CS2", pin: "G6", name: "spi0_ss2_p0_15"},
          { signal: "MOSI", pin: "G7", name: "spi0_mosi_p0_9"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "15000000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { zephyr: "spi1", datamodel: "SPI1", enable: "SPI1_ENABLE",
      pins: [
          { signal: "CS0", pin: "B11", name: "spi1_ss0_p0_16"},
          { signal: "SCK", pin: "C11", name: "spi1_sck_p0_19"},
          { signal: "SDIO2", pin: "D10", name: "spi1_sdio2_p0_20"},
          { signal: "MOSI", pin: "D9", name: "spi1_mosi_p0_17"},
          { signal: "MISO", pin: "E9", name: "spi1_miso_p0_18"},
          { signal: "SDIO3", pin: "F8", name: "spi1_sdio3_p0_21"},
          { signal: "CS1", pin: "F9", name: "spi1_ss1_p0_22"},
          { signal: "CS2", pin: "G8", name: "spi1_ss2_p0_23"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "15000000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { zephyr: "spi2", datamodel: "SPI2", enable: "SPI2_ENABLE",
      pins: [
          { signal: "CS2", pin: "B5", name: "spi2_ss2_p0_31"},
          { signal: "CS1", pin: "C6", name: "spi2_ss1_p0_30"},
          { signal: "SDIO2", pin: "C7", name: "spi2_sdio2_p0_28"},
          { signal: "MISO", pin: "C8", name: "spi2_miso_p0_26"},
          { signal: "SDIO3", pin: "D6", name: "spi2_sdio3_p0_29"},
          { signal: "SCK", pin: "D7", name: "spi2_sck_p0_27"},
          { signal: "MOSI", pin: "D8", name: "spi2_mosi_p0_25"},
          { signal: "CS0", pin: "E8", name: "spi2_ss0_p0_24"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "15000000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { zephyr: "timer0", datamodel: "TMR0", enable: "TMR0_ENABLE",
      pins: [
          { signal: "IOA", pin: "A8", name: "tmr0_p0_6"},
          { signal: "IOA", pin: "B6", name: "tmr0_p0_0"},
          { signal: "IOA", pin: "C6", name: "tmr0_p0_30"},
          { signal: "IOA", pin: "E5", name: "tmr0_p0_12"},
          { signal: "IOA", pin: "E8", name: "tmr0_p0_24"},
          { signal: "IOA", pin: "E9", name: "tmr0_p0_18"}
      ],
      subnode: () => getAssignedPeripheral("TMR0").Config?.MODE === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR0").Config?.MODE === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV", cfg_default: "1"}
      ]},
    { zephyr: "timer1", datamodel: "TMR1", enable: "TMR1_ENABLE",
      pins: [
          { signal: "IOA", pin: "B5", name: "tmr1_p0_31"},
          { signal: "IOA", pin: "B7", name: "tmr1_p0_1"},
          { signal: "IOA", pin: "B8", name: "tmr1_p0_7"},
          { signal: "IOA", pin: "C11", name: "tmr1_p0_19"},
          { signal: "IOA", pin: "D5", name: "tmr1_p0_13"},
          { signal: "IOA", pin: "D8", name: "tmr1_p0_25"}
      ],
      subnode: () => getAssignedPeripheral("TMR1").Config?.MODE === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR1").Config?.MODE === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV", cfg_default: "1"}
      ]},
    { zephyr: "timer2", datamodel: "TMR2", enable: "TMR2_ENABLE",
      pins: [
          { signal: "IOA", pin: "C10", name: "tmr2_p0_2"},
          { signal: "IOA", pin: "C8", name: "tmr2_p0_26"},
          { signal: "IOA", pin: "D10", name: "tmr2_p0_20"},
          { signal: "IOA", pin: "F5", name: "tmr2_p0_14"},
          { signal: "IOA", pin: "F7", name: "tmr2_p0_8"}
      ],
      subnode: () => getAssignedPeripheral("TMR2").Config?.MODE === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR2").Config?.MODE === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV", cfg_default: "1"}
      ]},
    { zephyr: "timer3", datamodel: "TMR3", enable: "TMR3_ENABLE",
      pins: [
          { signal: "IOA", pin: "C9", name: "tmr3_p0_3"},
          { signal: "IOA", pin: "D7", name: "tmr3_p0_27"},
          { signal: "IOA", pin: "F8", name: "tmr3_p0_21"},
          { signal: "IOA", pin: "G6", name: "tmr3_p0_15"},
          { signal: "IOA", pin: "G7", name: "tmr3_p0_9"}
      ],
      subnode: () => getAssignedPeripheral("TMR3").Config?.MODE === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR3").Config?.MODE === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV", cfg_default: "1"}
      ]},
    { zephyr: "timer4", datamodel: "TMR4", enable: "TMR4_ENABLE",
      pins: [
          { signal: "IOA", pin: "B11", name: "tmr4_p0_16"},
          { signal: "IOA", pin: "B9", name: "tmr4_p0_4"},
          { signal: "IOA", pin: "C7", name: "tmr4_p0_28"},
          { signal: "IOA", pin: "E6", name: "tmr4_p0_10"},
          { signal: "IOA", pin: "F9", name: "tmr4_p0_22"}
      ],
      subnode: () => getAssignedPeripheral("TMR4").Config?.MODE === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR4").Config?.MODE === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV", cfg_default: "1"}
      ]},
    { zephyr: "timer5", datamodel: "TMR5", enable: "TMR5_ENABLE",
      pins: [
          { signal: "IOA", pin: "A9", name: "tmr5_p0_5"},
          { signal: "IOA", pin: "D6", name: "tmr5_p0_29"},
          { signal: "IOA", pin: "D9", name: "tmr5_p0_17"},
          { signal: "IOA", pin: "F6", name: "tmr5_p0_11"},
          { signal: "IOA", pin: "G8", name: "tmr5_p0_23"}
      ],
      subnode: () => getAssignedPeripheral("TMR5").Config?.MODE === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR5").Config?.MODE === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV", cfg_default: "1"}
      ]},
    { zephyr: "trng", datamodel: "TRNG"},
    { zephyr: "uart0", datamodel: "UART0", enable: "UART0_ENABLE", clock_mux: "UART0_MUX", clock_default: "PCLK",
      pins: [
          { signal: "RTS", pin: "C2", name: "uart0_rts_p1_7"},
          { signal: "CTS", pin: "C3", name: "uart0_cts_p1_6"},
          { signal: "TX", pin: "C4", name: "uart0_tx_p1_5"},
          { signal: "RX", pin: "C5", name: "uart0_rx_p1_4"},
          { signal: "RX", pin: "E6", name: "uart0_rx_p0_10"},
          { signal: "RTS", pin: "F6", name: "uart0_rts_p0_11"},
          { signal: "CTS", pin: "F7", name: "uart0_cts_p0_8"},
          { signal: "TX", pin: "G7", name: "uart0_tx_p0_9"}
      ],
      config: [
          { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200"},
          { name: "hw-flow-control", type: "boolean", control: "HW_FLOW_CTRL", cfg_default: "DISABLED",
            value: x => x !== "DISABLED"},
          { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
            value: x => (x === "DISABLED" ? "none" : x.toLowerCase()) },
          { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
            value: x => (x === "1" ? "1" : (getAssignedPeripheral("UART0").Config?.CHAR_SIZE === "5" ? "1_5" : "2"))},
          { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5"}
      ]},
    { zephyr: "uart1", datamodel: "UART1", enable: "UART1_ENABLE", clock_mux: "UART1_MUX", clock_default: "PCLK",
      pins: [
          { signal: "RX", pin: "D10", name: "uart1_rx_p0_20"},
          { signal: "RX", pin: "E2", name: "uart1_rx_p1_12"},
          { signal: "TX", pin: "E3", name: "uart1_tx_p1_13"},
          { signal: "CTS", pin: "E4", name: "uart1_cts_p1_14"},
          { signal: "TX", pin: "F8", name: "uart1_tx_p0_21"},
          { signal: "CTS", pin: "F9", name: "uart1_cts_p0_22"},
          { signal: "RTS", pin: "G5", name: "uart1_rts_p1_15"},
          { signal: "RTS", pin: "G8", name: "uart1_rts_p0_23"}
      ],
      config: [
          { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200"},
          { name: "hw-flow-control", type: "boolean", control: "HW_FLOW_CTRL", cfg_default: "DISABLED",
            value: x => x !== "DISABLED"},
          { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
            value: x => (x === "DISABLED" ? "none" : x.toLowerCase()) },
          { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
            value: x => (x === "1" ? "1" : (getAssignedPeripheral("UART1").Config?.CHAR_SIZE === "5" ? "1_5" : "2"))},
          { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5"}
      ]},
    { zephyr: "uart2", datamodel: "UART2", enable: "UART2_ENABLE", clock_mux: "UART2_MUX", clock_default: "PCLK",
      pins: [
          { signal: "RTS", pin: "B5", name: "uart2_rts_p0_31"},
          { signal: "CTS", pin: "B6", name: "uart2_cts_p0_0"},
          { signal: "TX", pin: "B7", name: "uart2_tx_p0_1"},
          { signal: "RX", pin: "C10", name: "uart2_rx_p0_2"},
          { signal: "CTS", pin: "C6", name: "uart2_cts_p0_30"},
          { signal: "RX", pin: "C7", name: "uart2_rx_p0_28"},
          { signal: "RTS", pin: "C9", name: "uart2_rts_p0_3"},
          { signal: "TX", pin: "D6", name: "uart2_tx_p0_29"}
      ],
      config: [
          { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200"},
          { name: "hw-flow-control", type: "boolean", control: "HW_FLOW_CTRL", cfg_default: "DISABLED",
            value: x => x !== "DISABLED"},
          { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
            value: x => (x === "DISABLED" ? "none" : x.toLowerCase()) },
          { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
            value: x => (x === "1" ? "1" : (getAssignedPeripheral("UART2").Config?.CHAR_SIZE === "5" ? "1_5" : "2"))},
          { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5"}
      ]},
    { zephyr: "wdt0", datamodel: "WDT0", enable: "WDT0_ENABLE"},
    { zephyr: "wut0", datamodel: "WUT", zephyrVersionMin: "4.3.0"}
];

} else if (it.cfsconfig.Package.toUpperCase() === "CTBGA") {

peripheralData = [
    { zephyr: "adc", datamodel: "ADC", enable: "ENABLE",
      pins: [
          { signal: "AIN7", pin: "D8", name: "ain3p_p0_23"},
          { signal: "AIN5", pin: "E8", name: "ain2p_p0_21"},
          { signal: "AIN6", pin: "E9", name: "ain3n_p0_22"},
          { signal: "AIN2", pin: "G9", name: "ain1n_p0_18"},
          { signal: "AIN4", pin: "H10", name: "ain2n_p0_20"},
          { signal: "AIN1", pin: "H9", name: "ain0p_p0_17"},
          { signal: "AIN3", pin: "J11", name: "ain1p_p0_19"},
          { signal: "AIN0", pin: "K11", name: "ain0n_p0_16"}
      ]},
    { zephyr: "dma0", datamodel: "DMA0", enable: "DMA0_ENABLE"},
    { zephyr: "dma1", datamodel: "DMA1", enable: "DMA1_ENABLE"},
    { zephyr: "flc0", datamodel: "FLC0"},
    { zephyr: "flc1", datamodel: "FLC1"},
    { zephyr: "i2c0", datamodel: "I2C0", enable: "I2C0_ENABLE",
      pins: [
          { signal: "SDA", pin: "K8", name: "i2c0_sda_p0_7"},
          { signal: "SCL", pin: "L8", name: "i2c0_scl_p0_6"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { zephyr: "i2c1", datamodel: "I2C1", enable: "I2C1_ENABLE",
      pins: [
          { signal: "SDA", pin: "D6", name: "i2c1_sda_p0_15"},
          { signal: "SCL", pin: "F5", name: "i2c1_scl_p0_14"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { zephyr: "i2c2", datamodel: "I2C2", enable: "I2C2_ENABLE",
      pins: [
          { signal: "SDA", pin: "D5", name: "i2c2_sda_p1_15"},
          { signal: "SCL", pin: "G4", name: "i2c2_scl_p1_14"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { zephyr: "w1", datamodel: "OWM", enable: "ENABLE",
      pins: [
          { signal: "IO", pin: "G5", name: "owm_io_p0_12"},
          { signal: "IO", pin: "G8", name: "owm_io_p0_24"},
          { signal: "PE", pin: "H5", name: "owm_pe_p0_13"},
          { signal: "PE", pin: "H8", name: "owm_pe_p0_25"},
          { signal: "PE", pin: "H9", name: "owm_pe_p0_17"},
          { signal: "IO", pin: "K11", name: "owm_io_p0_16"},
          { signal: "IO", pin: "K9", name: "owm_io_p0_4"},
          { signal: "PE", pin: "L9", name: "owm_pe_p0_5"}
      ],
      config: [
          { name: "internal-pullup", type: "int", control: "INTERNAL_PULL_UP", cfg_default: "0",
            value: x => (x === "TRUE" ? "1" : "0")},
          { name: "external-pullup", type: "int", control: "EXTERNAL_PULL_UP", cfg_default: "2",
            value: x => (x === "TRUE" ? (getAssignedPeripheral("OWM").Config?.EXT_PULL_UP_MODE === "ACTIVE_LOW" ? "1" : "0") : "2")},
          { name: "long-line-mode", type: "boolean", control: "LONG_LINE_MODE", cfg_default: false,
            value: x => (x === "LONG")}
      ]},
    { zephyr: "rtc_counter", datamodel: "RTC"},
    //ZEPHYR-861
    /*{ zephyr: "sdhc0", datamodel: "SDHC", enable: "ENABLE",
      pins: [
          { signal: "CDN", pin: "J2", name: "sdhc_cdn_p1_7"},
          { signal: "WP", pin: "J3", name: "sdhc_wp_p1_6"},
          { signal: "DAT2", pin: "J4", name: "sdhc_dat2_p1_5"},
          { signal: "DAT1", pin: "J5", name: "sdhc_dat1_p1_4"},
          { signal: "DAT3", pin: "K2", name: "sdhc_dat3_p1_0"},
          { signal: "CMD", pin: "K3", name: "sdhc_cmd_p1_1"},
          { signal: "CLK", pin: "K4", name: "sdhc_clk_p1_3"},
          { signal: "DAT0", pin: "L4", name: "sdhc_dat0_p1_2"}
      ]},*/
    { zephyr: "spi0", datamodel: "SPI0", enable: "ENABLE",
      pins: [
          { signal: "CS2", pin: "D6", name: "spi0_ss2_p0_15"},
          { signal: "MOSI", pin: "D7", name: "spi0_mosi_p0_9"},
          { signal: "SDIO2", pin: "E5", name: "spi0_sdio2_p1_12"},
          { signal: "SDIO3", pin: "E6", name: "spi0_sdio3_p1_13"},
          { signal: "CS0", pin: "E7", name: "spi0_ss0_p0_8"},
          { signal: "CS1", pin: "F5", name: "spi0_ss1_p0_14"},
          { signal: "SCK", pin: "F6", name: "spi0_sck_p0_11"},
          { signal: "SDIO2", pin: "G5", name: "spi0_sdio2_p0_12"},
          { signal: "MISO", pin: "G6", name: "spi0_miso_p0_10"},
          { signal: "MOSI", pin: "H1", name: "spi0_mosi_p1_9"},
          { signal: "SCK", pin: "H2", name: "spi0_sck_p1_11"},
          { signal: "MISO", pin: "H3", name: "spi0_miso_p1_10"},
          { signal: "CS0", pin: "H4", name: "spi0_ss0_p1_8"},
          { signal: "SDIO3", pin: "H5", name: "spi0_sdio3_p0_13"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "15000000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { zephyr: "spi1", datamodel: "SPI1", enable: "SPI1_ENABLE",
      pins: [
          { signal: "CS2", pin: "D8", name: "spi1_ss2_p0_23"},
          { signal: "SDIO3", pin: "E8", name: "spi1_sdio3_p0_21"},
          { signal: "CS1", pin: "E9", name: "spi1_ss1_p0_22"},
          { signal: "MISO", pin: "G9", name: "spi1_miso_p0_18"},
          { signal: "SDIO2", pin: "H10", name: "spi1_sdio2_p0_20"},
          { signal: "MOSI", pin: "H9", name: "spi1_mosi_p0_17"},
          { signal: "SCK", pin: "J11", name: "spi1_sck_p0_19"},
          { signal: "CS0", pin: "K11", name: "spi1_ss0_p0_16"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "15000000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { zephyr: "spi2", datamodel: "SPI2", enable: "SPI2_ENABLE",
      pins: [
          { signal: "CS0", pin: "G8", name: "spi2_ss0_p0_24"},
          { signal: "SDIO3", pin: "H6", name: "spi2_sdio3_p0_29"},
          { signal: "SCK", pin: "H7", name: "spi2_sck_p0_27"},
          { signal: "MOSI", pin: "H8", name: "spi2_mosi_p0_25"},
          { signal: "CS1", pin: "J6", name: "spi2_ss1_p0_30"},
          { signal: "SDIO2", pin: "J7", name: "spi2_sdio2_p0_28"},
          { signal: "MISO", pin: "J8", name: "spi2_miso_p0_26"},
          { signal: "CS2", pin: "K5", name: "spi2_ss2_p0_31"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "15000000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { zephyr: "timer0", datamodel: "TMR0", enable: "TMR0_ENABLE",
      pins: [
          { signal: "IOA", pin: "G5", name: "tmr0_p0_12"},
          { signal: "IOA", pin: "G8", name: "tmr0_p0_24"},
          { signal: "IOA", pin: "G9", name: "tmr0_p0_18"},
          { signal: "IOA", pin: "J6", name: "tmr0_p0_30"},
          { signal: "IOA", pin: "K6", name: "tmr0_p0_0"},
          { signal: "IOA", pin: "L8", name: "tmr0_p0_6"}
      ],
      subnode: () => getAssignedPeripheral("TMR0").Config?.MODE === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR0").Config?.MODE === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV", cfg_default: "1"}
      ]},
    { zephyr: "timer1", datamodel: "TMR1", enable: "TMR1_ENABLE",
      pins: [
          { signal: "IOA", pin: "H5", name: "tmr1_p0_13"},
          { signal: "IOA", pin: "H8", name: "tmr1_p0_25"},
          { signal: "IOA", pin: "J11", name: "tmr1_p0_19"},
          { signal: "IOA", pin: "K5", name: "tmr1_p0_31"},
          { signal: "IOA", pin: "K7", name: "tmr1_p0_1"},
          { signal: "IOA", pin: "K8", name: "tmr1_p0_7"}
      ],
      subnode: () => getAssignedPeripheral("TMR1").Config?.MODE === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR1").Config?.MODE === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV", cfg_default: "1"}
      ]},
    { zephyr: "timer2", datamodel: "TMR2", enable: "TMR2_ENABLE",
      pins: [
          { signal: "IOA", pin: "E7", name: "tmr2_p0_8"},
          { signal: "IOA", pin: "F5", name: "tmr2_p0_14"},
          { signal: "IOA", pin: "H10", name: "tmr2_p0_20"},
          { signal: "IOA", pin: "J10", name: "tmr2_p0_2"},
          { signal: "IOA", pin: "J8", name: "tmr2_p0_26"}
      ],
      subnode: () => getAssignedPeripheral("TMR2").Config?.MODE === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR2").Config?.MODE === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV", cfg_default: "1"}
      ]},
    { zephyr: "timer3", datamodel: "TMR3", enable: "TMR3_ENABLE",
      pins: [
          { signal: "IOA", pin: "D6", name: "tmr3_p0_15"},
          { signal: "IOA", pin: "D7", name: "tmr3_p0_9"},
          { signal: "IOA", pin: "E8", name: "tmr3_p0_21"},
          { signal: "IOA", pin: "H7", name: "tmr3_p0_27"},
          { signal: "IOA", pin: "J9", name: "tmr3_p0_3"}
      ],
      subnode: () => getAssignedPeripheral("TMR3").Config?.MODE === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR3").Config?.MODE === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV", cfg_default: "1"}
      ]},
    { zephyr: "timer4", datamodel: "TMR4", enable: "TMR4_ENABLE",
      pins: [
          { signal: "IOA", pin: "E9", name: "tmr4_p0_22"},
          { signal: "IOA", pin: "G6", name: "tmr4_p0_10"},
          { signal: "IOA", pin: "J7", name: "tmr4_p0_28"},
          { signal: "IOA", pin: "K11", name: "tmr4_p0_16"},
          { signal: "IOA", pin: "K9", name: "tmr4_p0_4"}
      ],
      subnode: () => getAssignedPeripheral("TMR4").Config?.MODE === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR4").Config?.MODE === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV", cfg_default: "1"}
      ]},
    { zephyr: "timer5", datamodel: "TMR5", enable: "TMR5_ENABLE",
      pins: [
          { signal: "IOA", pin: "D8", name: "tmr5_p0_23"},
          { signal: "IOA", pin: "F6", name: "tmr5_p0_11"},
          { signal: "IOA", pin: "H6", name: "tmr5_p0_29"},
          { signal: "IOA", pin: "H9", name: "tmr5_p0_17"},
          { signal: "IOA", pin: "L9", name: "tmr5_p0_5"}
      ],
      subnode: () => getAssignedPeripheral("TMR5").Config?.MODE === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR5").Config?.MODE === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV", cfg_default: "1"}
      ]},
    { zephyr: "trng", datamodel: "TRNG"},
    { zephyr: "uart0", datamodel: "UART0", enable: "UART0_ENABLE", clock_mux: "UART0_MUX", clock_default: "PCLK",
      pins: [
          { signal: "TX", pin: "D7", name: "uart0_tx_p0_9"},
          { signal: "CTS", pin: "E7", name: "uart0_cts_p0_8"},
          { signal: "RTS", pin: "F6", name: "uart0_rts_p0_11"},
          { signal: "RX", pin: "G6", name: "uart0_rx_p0_10"},
          { signal: "RTS", pin: "J2", name: "uart0_rts_p1_7"},
          { signal: "CTS", pin: "J3", name: "uart0_cts_p1_6"},
          { signal: "TX", pin: "J4", name: "uart0_tx_p1_5"},
          { signal: "RX", pin: "J5", name: "uart0_rx_p1_4"}
      ],
      config: [
          { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200"},
          { name: "hw-flow-control", type: "boolean", control: "HW_FLOW_CTRL", cfg_default: "DISABLED",
            value: x => x !== "DISABLED"},
          { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
            value: x => (x === "DISABLED" ? "none" : x.toLowerCase()) },
          { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
            value: x => (x === "1" ? "1" : (getAssignedPeripheral("UART0").Config?.CHAR_SIZE === "5" ? "1_5" : "2"))},
          { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5"}
      ]},
    { zephyr: "uart1", datamodel: "UART1", enable: "UART1_ENABLE", clock_mux: "UART1_MUX", clock_default: "PCLK",
      pins: [
          { signal: "RTS", pin: "D5", name: "uart1_rts_p1_15"},
          { signal: "RTS", pin: "D8", name: "uart1_rts_p0_23"},
          { signal: "RX", pin: "E5", name: "uart1_rx_p1_12"},
          { signal: "TX", pin: "E6", name: "uart1_tx_p1_13"},
          { signal: "TX", pin: "E8", name: "uart1_tx_p0_21"},
          { signal: "CTS", pin: "E9", name: "uart1_cts_p0_22"},
          { signal: "CTS", pin: "G4", name: "uart1_cts_p1_14"},
          { signal: "RX", pin: "H10", name: "uart1_rx_p0_20"}
      ],
      config: [
          { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200"},
          { name: "hw-flow-control", type: "boolean", control: "HW_FLOW_CTRL", cfg_default: "DISABLED",
            value: x => x !== "DISABLED"},
          { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
            value: x => (x === "DISABLED" ? "none" : x.toLowerCase()) },
          { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
            value: x => (x === "1" ? "1" : (getAssignedPeripheral("UART1").Config?.CHAR_SIZE === "5" ? "1_5" : "2"))},
          { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5"}
      ]},
    { zephyr: "uart2", datamodel: "UART2", enable: "UART2_ENABLE", clock_mux: "UART2_MUX", clock_default: "PCLK",
      pins: [
          { signal: "TX", pin: "H6", name: "uart2_tx_p0_29"},
          { signal: "RX", pin: "J10", name: "uart2_rx_p0_2"},
          { signal: "CTS", pin: "J6", name: "uart2_cts_p0_30"},
          { signal: "RX", pin: "J7", name: "uart2_rx_p0_28"},
          { signal: "RTS", pin: "J9", name: "uart2_rts_p0_3"},
          { signal: "RTS", pin: "K5", name: "uart2_rts_p0_31"},
          { signal: "CTS", pin: "K6", name: "uart2_cts_p0_0"},
          { signal: "TX", pin: "K7", name: "uart2_tx_p0_1"}
      ],
      config: [
          { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200"},
          { name: "hw-flow-control", type: "boolean", control: "HW_FLOW_CTRL", cfg_default: "DISABLED",
            value: x => x !== "DISABLED"},
          { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
            value: x => (x === "DISABLED" ? "none" : x.toLowerCase()) },
          { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
            value: x => (x === "1" ? "1" : (getAssignedPeripheral("UART2").Config?.CHAR_SIZE === "5" ? "1_5" : "2"))},
          { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5"}
      ]},
    { zephyr: "wdt0", datamodel: "WDT0", enable: "WDT0_ENABLE"},
    { zephyr: "wut0", datamodel: "WUT", zephyrVersionMin: "4.3.0"}
];

}

// Filter peripheralData based on zephyrVersionMin/zephyrVersionMax.
// Entries outside the supported range are removed and later added to unsupported_in_dts.
const { supported, unsupported } = filterByZephyrVersion(peripheralData);

// Replace peripheralData with only the supported peripherals so the template
// does not generate code for peripherals filtered out by version constraints.
peripheralData = supported;

unsupported_in_dts = [
    {clocknode: "ADC_CLK_SCALER", diag: "The clock divider for ADC is not currently supported in devicetree.", ctrl: "DIV"},
    {datamodel: "AUDIO", diag: "The Audio Interface peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE", MUX: "MUX"},
    {datamodel: "BLE", diag: "Bluetooth is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "CM4 (CPU1)", diag: "CPU1 is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "USBHS", clocknode: "High-Speed USB", diag: "High-Speed USB is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {clocknode: "HTIMER0/1", diag: "HTMR0 is not currently supported in devicetree.", ctrl: "HTMR0_ENABLE", value: "TRUE"},
    {clocknode: "HTIMER0/1", diag: "HTMR1 is not currently supported in devicetree.", ctrl: "HTMR1_ENABLE", value: "TRUE"},
    {clocknode: "HSO_DIV_2_4", diag: "The HSO clock selection is not currently supported in devicetree.",  ctrl: "DIV", value: "4"},
    {datamodel: "PT0", diag: "The Pulse Trains peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "PT1", diag: "The Pulse Trains peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "PT2", diag: "The Pulse Trains peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "PT3", diag: "The Pulse Trains peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "PT4", diag: "The Pulse Trains peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "PT5", diag: "The Pulse Trains peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "PT6", diag: "The Pulse Trains peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "PT7", diag: "The Pulse Trains peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "PT8", diag: "The Pulse Trains peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "PT9", diag: "The Pulse Trains peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "PT10", diag: "The Pulse Trains peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "PT11", diag: "The Pulse Trains peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "PT12", diag: "The Pulse Trains peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "PT13", diag: "The Pulse Trains peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "PT14", diag: "The Pulse Trains peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "PT15", diag: "The Pulse Trains peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "SDHC", diag: "The SDHC peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"}, //ZEPHYR-861
    {datamodel: "TPU", diag: "The Trust Protection Unit peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "WDT1", diag: "The Watchdog Timer 1 peripheral is not currently supported in devicetree.", ctrl: "WDT1_ENABLE", value: "TRUE"}, //ZEPHYR-864
    {datamodel: "WDT2", diag: "The Watchdog Timer 2 peripheral is not currently supported in devicetree.", ctrl: "WDT2_ENABLE", value: "TRUE"}, //ZEPHYR-864
    {datamodel: "RTC", clocknode: "SQWOUT", diag: "Enabling SQWOUT from the RTC is not currently supported in devicetree.", ctrl: "SQWOUT", value: "1HZ"},
    {datamodel: "RTC", clocknode: "SQWOUT", diag: "Enabling SQWOUT from the RTC is not currently supported in devicetree.", ctrl: "SQWOUT", value: "512HZ"},
    {datamodel: "RTC", clocknode: "SQWOUT", diag: "Enabling SQWOUT from the RTC is not currently supported in devicetree.", ctrl: "SQWOUT", value: "4KHZ"},
    {datamodel: "RTC", clocknode: "SQWOUT", diag: "Enabling SQWOUT from the RTC is not currently supported in devicetree.", ctrl: "SQWOUT", value: "32KHZ"},
    {clocknode: "ERTCO Mux", diag: "Bypass of the ERTCO is not currently supported in devicetree.", ctrl: "MUX", value: "ERTCO_CLK"},
    {clocknode: "ERFO Mux", diag: "Bypass of the ERFO is not currently supported in devicetree.", ctrl: "MUX", value: "ERFO_CLK"},
];

// Add filtered-out peripherals to unsupported_in_dts
unsupported_in_dts.push(...buildUnsupportedVersionEntries(unsupported));

function mapClockName(clock) {
    if (clock === "HSO") {
        return "ipo";
    } else if (clock === "OBRC") {
        return "ibro";
    } else if (clock === "LPO") {
        return "iso";
    } else if (clock === "INRO") {
        return undefined;
    } else if (clock === "PCLK") {
        return undefined;
    }
    return clock.toLowerCase();
}

function getClocksUsed() {
    let clocksUsed = new Set();
    for (const peri of supported) {
        if (peri.clock_mux && isPeripheralClockSetTo(peri.datamodel, peri.enable, "TRUE")) {
            const clockName = mapClockName(getPeripheralClockSetting(peri.datamodel, peri.clock_mux, peri.clock_default));
            if (clockName) {
                clocksUsed.add(clockName);
            }
        }
    }
    const clockName = mapClockName(getClockSetting("SYS_OSC Mux", "MUX", "HSO"));
    if (clockName) {
      clocksUsed.add(clockName);
    }
    return Array.from(clocksUsed).sort();
}
