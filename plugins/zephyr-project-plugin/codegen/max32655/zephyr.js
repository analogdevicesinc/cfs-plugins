/**
 * Copyright (c) 2024-2025 Analog Devices, Inc.
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

if (it.cfsconfig.Package.toUpperCase() === "CTBGA") {

  peripheralData = [
    { datamodel: "ADC", enable: "ENABLE", zephyr: "adc",
      pins: [
          { signal: "AIN0", pin: "C4", name: "ain0_p2_0"},
          { signal: "AIN1", pin: "C5", name: "ain1_p2_1"},
          { signal: "AIN6", pin: "C6", name: "ain6_p2_6"},
          { signal: "AIN4", pin: "C7", name: "ain4_p2_4"},
          { signal: "AIN7", pin: "D6", name: "ain7_p2_7"},
          { signal: "AIN5", pin: "D7", name: "ain5_p2_5"},
          { signal: "AIN2", pin: "D8", name: "ain2_p2_2"},
          { signal: "AIN3", pin: "E8", name: "ain3_p2_3"}
      ]
    },
    { datamodel: "DMA", enable: "ENABLE", zephyr: "dma0" },
    { datamodel: "I2C0", enable: "I2C0_ENABLE", zephyr: "i2c0",
      pins: [
          { signal: "SCL", pin: "H7", name: "i2c0_scl_p0_10"},
          { signal: "SDA", pin: "J8", name: "i2c0_sda_p0_11"}
      ],
      config: [
        { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
          value: x => convertToUnitsMacro(x, "FREQ", 1000)
        }
      ]},
    { datamodel: "I2C1", enable: "I2C1_ENABLE", zephyr: "i2c1",
      pins: [
          { signal: "SDA", pin: "F5", name: "i2c1_sda_p0_17"},
          { signal: "SCL", pin: "G5", name: "i2c1_scl_p0_16"}
      ],
      config: [
        { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
          value: x => convertToUnitsMacro(x, "FREQ", 1000)
        }
      ]},
    { datamodel: "I2C2", enable: "I2C2_ENABLE", zephyr: "i2c2",
      pins: [
          { signal: "SCL", pin: "F1", name: "i2c2_scl_p0_30"},
          { signal: "SDA", pin: "F4", name: "i2c2_sda_p0_31"}
      ],
      config: [
        { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
          value: x => convertToUnitsMacro(x, "FREQ", 1000)
        }
      ]},
    { datamodel: "LPTMR0", enable: "ENABLE", zephyr: "lptimer0", clock_mux : "MUX", clock_default : "IBRO",
      pins: [
          { signal: "IOA", pin: "C7", name: "lptmr0b_ioa_p2_4"}
      ],
      subnode: () => getAssignedPeripheral("LPTMR0").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("LPTMR0").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { datamodel: "LPTMR1", enable: "ENABLE", zephyr: "lptimer1", clock_mux : "MUX", clock_default : "IBRO",
      pins: [
          { signal: "IOA", pin: "D7", name: "lptmr1b_ioa_p2_5"}
      ],
      subnode: () => getAssignedPeripheral("LPTMR1").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("LPTMR1").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { datamodel: "LPUART0", enable: "ENABLE", zephyr: "uart3", clock_mux : "MUX", clock_default : "IBRO",
      pins: [
          { signal: "RX", pin: "C6", name: "lpuartb_rx_p2_6"},
          { signal: "TX", pin: "D6", name: "lpuartb_tx_p2_7"}
      ],
      config: [
          { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200" },
          { name: "hw-flow-control", type: "boolean", control: "HW_FLOW_CTRL", cfg_default: "DISABLED",
            value: x => x !== "DISABLED"},
          { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
            value: x => (x === "DISABLED" ? "none" : (x === "EVEN" ? "even" : "odd"))},
          { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
            value: x => (x === "1" ? "1" : (getAssignedPeripheral("LPUART0").Config?.CHAR_SIZE === "5" ? "1_5" : "2"))},
          { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5"}
      ]},
    { datamodel: "OWM", enable: "ENABLE", zephyr: "w1",
      pins: [
          { signal: "PE", pin: "G4", name: "owm_pe_p0_19"},
          { signal: "IO", pin: "G7", name: "owm_io_p0_6"},
          { signal: "IO", pin: "H5", name: "owm_io_p0_18"},
          { signal: "PE", pin: "H9", name: "owm_pe_p0_7"}
      ],
      config : [
        { name: "internal-pullup", type: "int", control: "INTERNAL_PULL_UP", cfg_default: "0",
          value: x => (x === "TRUE" ? "1" : "0")
        },
        { name: "external-pullup", type: "int", control: "EXTERNAL_PULL_UP", cfg_default: "2",
          value: x => (x === "TRUE" ? (getAssignedPeripheral("OWM").Config?.EXT_PULL_UP_MODE === "ACTIVE_LOW" ? "1" : "0") : "2")
        },
        { name: "long-line-mode", type: "boolean", control: "LONG_LINE_MODE", cfg_default: false,
          value: x => (x === "LONG")
        }
      ]
    },
    { datamodel: "RTC", zephyr: "rtc_counter" },
    { datamodel: "SPI0", enable: "ENABLE", zephyr: "spi0",
      pins: [
          { signal: "MISO", pin: "G7", name: "spi0_miso_p0_6"},
          { signal: "MOSI", pin: "G8", name: "spi0_mosi_p0_5"},
          { signal: "CS0", pin: "G9", name: "spi0_ss0_p0_4"},
          { signal: "CS2", pin: "H7", name: "spi0_ss2_p0_10"},
          { signal: "SDIO2", pin: "H8", name: "spi0_sdio2_p0_8"},
          { signal: "SCK", pin: "H9", name: "spi0_sck_p0_7"},
          { signal: "CS1", pin: "J8", name: "spi0_ss1_p0_11"},
          { signal: "SDIO3", pin: "J9", name: "spi0_sdio3_p0_9"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "50000000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { datamodel: "SPI1", enable: "ENABLE", zephyr: "spi1",
      pins: [
          { signal: "SCK", pin: "G3", name: "spi1_sck_p0_23"},
          { signal: "CS1", pin: "H1", name: "spi1_ss1_p0_26"},
          { signal: "CS2", pin: "H2", name: "spi1_ss2_p0_27"},
          { signal: "MISO", pin: "H3", name: "spi1_miso_p0_22"},
          { signal: "CS0", pin: "H4", name: "spi1_ss0_p0_20"},
          { signal: "SDIO3", pin: "J1", name: "spi1_sdio3_p0_25"},
          { signal: "SDIO2", pin: "J2", name: "spi1_sdio2_p0_24"},
          { signal: "MOSI", pin: "J3", name: "spi1_mosi_p0_21"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "50000000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { datamodel: "TMR0", enable: "TMR0_ENABLE", zephyr: "timer0", clock_mux : "TMR0a_MUX", clock_default : "PCLK",
      pins: [
          { signal: "IOA", pin: "F8", name: "tmr0a_ioa_p0_2"},
          { signal: "IOB", pin: "F9", name: "ext_clk_p0_3"},
          { signal: "IOBN", pin: "G8", name: "tmr0b_iobn_p0_5"},
          { signal: "IOAN", pin: "G9", name: "tmr0b_ioan_p0_4"},
          { signal: "IOA", pin: "H8", name: "tmr0b_ioa_p0_8"},
          { signal: "IOB", pin: "J9", name: "tmr0b_iob_p0_9"}
      ],
      subnode: () => getAssignedPeripheral("TMR0").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR0").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { datamodel: "TMR1", enable: "TMR1_ENABLE", zephyr: "timer1", clock_mux : "TMR1a_MUX", clock_default : "PCLK",
      pins: [
          { signal: "IOBN", pin: "G3", name: "tmr1b_iobn_p0_23"},
          { signal: "IOAN", pin: "G6", name: "tmr1b_ioan_p0_12"},
          { signal: "IOAN", pin: "H3", name: "tmr1b_ioan_p0_22"},
          { signal: "IOA", pin: "H4", name: "tmr1b_ioa_p0_20"},
          { signal: "IOBN", pin: "H6", name: "tmr1b_iobn_p0_13"},
          { signal: "IOB", pin: "J3", name: "tmr1b_iob_p0_21"},
          { signal: "IOB", pin: "J6", name: "tmr1a_iob_p0_15"},
          { signal: "IOA", pin: "J7", name: "tmr1a_ioa_p0_14"}
      ],
      subnode: () => getAssignedPeripheral("TMR1").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR1").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { datamodel: "TMR2", enable: "TMR2_ENABLE", zephyr: "timer2", clock_mux : "TMR2a_MUX", clock_default : "PCLK",
      pins: [
          { signal: "IOA", pin: "H1", name: "tmr2a_ioa_p0_26"},
          { signal: "IOB", pin: "H2", name: "tmr2a_iob_p0_27"},
          { signal: "IOB", pin: "J1", name: "tmr2b_iob_p0_25"},
          { signal: "IOA", pin: "J2", name: "tmr2b_ioa_p0_24"}
      ],
      subnode: () => getAssignedPeripheral("TMR2").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR2").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { datamodel: "TMR3", enable: "TMR3_ENABLE", zephyr: "timer3", clock_mux : "TMR3a_MUX", clock_default : "PCLK",
      pins: [
          { signal: "IOB", pin: "D4", name: "tmr3a_iob_p1_7"},
          { signal: "IOA", pin: "E1", name: "tmr3b_ioa_p1_4"},
          { signal: "IOA", pin: "E2", name: "tmr3a_ioa_p1_6"},
          { signal: "IOB", pin: "E3", name: "tmr3b_iob_p1_5"}
      ],
      subnode: () => getAssignedPeripheral("TMR3").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR3").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { datamodel: "TRNG", enable: "TRNG_ENABLE", zephyr: "trng" },
    { datamodel: "UART0", enable: "UART0_ENABLE", zephyr: "uart0", clock_mux: "UART0_MUX", clock_default: "PCLK",
      pins: [
          { signal: "TX", pin: "E7", name: "uart0a_tx_p0_1"},
          { signal: "RX", pin: "F7", name: "uart0a_rx_p0_0"},
          { signal: "CTS", pin: "F8", name: "uart0b_cts_p0_2"},
          { signal: "RTS", pin: "F9", name: "uart0b_rts_p0_3"}
      ],
      config: [
          { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200" },
          { name: "hw-flow-control", type: "boolean", control: "HW_FLOW_CTRL", cfg_default: "DISABLED",
            value: x => x !== "DISABLED"},
          { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
            value: x => (x === "DISABLED" ? "none" : (x === "EVEN" ? "even" : "odd"))},
          { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
            value: x => (x === "1" ? "1" : (getAssignedPeripheral("UART0").Config?.CHAR_SIZE === "5" ? "1_5" : "2"))},
          { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5"}
      ]},
    { datamodel: "UART1", enable: "UART1_ENABLE", zephyr: "uart1", clock_mux: "UART1_MUX", clock_default: "PCLK",
      pins: [
          { signal: "RX", pin: "G6", name: "uart1a_rx_p0_12"},
          { signal: "TX", pin: "H6", name: "uart1a_tx_p0_13"},
          { signal: "RTS", pin: "J6", name: "uart1b_rts_p0_15"},
          { signal: "CTS", pin: "J7", name: "uart1b_cts_p0_14"}
      ],
      config: [
          { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200" },
          { name: "hw-flow-control", type: "boolean", control: "HW_FLOW_CTRL", cfg_default: "DISABLED",
            value: x => x !== "DISABLED"},
          { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
            value: x => (x === "DISABLED" ? "none" : (x === "EVEN" ? "even" : "odd"))},
          { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
            value: x => (x === "1" ? "1" : (getAssignedPeripheral("UART1").Config?.CHAR_SIZE === "5" ? "1_5" : "2"))},
          { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5"}
      ]},
    { datamodel: "UART2", enable: "UART2_ENABLE", zephyr: "uart2", clock_mux: "UART2_MUX", clock_default: "PCLK",
      pins: [
          { signal: "CTS", pin: "F1", name: "uart2b_cts_p0_30"},
          { signal: "TX", pin: "F2", name: "uart2a_tx_p1_1"},
          { signal: "RX", pin: "F3", name: "uart2a_rx_p1_0"},
          { signal: "RTS", pin: "F4", name: "uart2b_rts_p0_31"}
      ],
      config: [
          { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200" },
          { name: "hw-flow-control", type: "boolean", control: "HW_FLOW_CTRL", cfg_default: "DISABLED",
            value: x => x !== "DISABLED"},
          { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
            value: x => (x === "DISABLED" ? "none" : (x === "EVEN" ? "even" : "odd"))},
          { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
            value: x => (x === "1" ? "1" : (getAssignedPeripheral("UART2").Config?.CHAR_SIZE === "5" ? "1_5" : "2"))},
          { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5"}
      ]},
    { datamodel: "WDT0", enable: "ENABLE", zephyr: "wdt0", clock_mux: "MUX", clock_default: "PCLK"},
    { datamodel: "LPWDT0", enable: "ENABLE", zephyr: "wdt1", clock_mux: "MUX", clock_default: "IBRO"}
  ];

} else {

  peripheralData = [
    { datamodel: "ADC", enable: "ENABLE", zephyr: "adc",
      pins: [
          { signal: "AIN6", pin: "C8", name: "ain6_p2_6"},
          { signal: "AIN7", pin: "D5", name: "ain7_p2_7"},
          { signal: "AIN1", pin: "D7", name: "ain1_p2_1"},
          { signal: "AIN0", pin: "F6", name: "ain0_p2_0"}
      ]},
    { datamodel: "DMA", enable: "ENABLE", zephyr: "dma0" },
    { datamodel: "I2C0", enable: "I2C0_ENABLE", zephyr: "i2c0",
      pins: [
          { signal: "SDA", pin: "A5", name: "i2c0_sda_p0_11"},
          { signal: "SCL", pin: "B4", name: "i2c0_scl_p0_10"}
      ],
      config: [
        { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
          value: x => convertToUnitsMacro(x, "FREQ", 1000)
        }
      ]},
    { datamodel: "LPTMR0", enable: "ENABLE", zephyr: "lptimer0", clock_mux : "MUX", clock_default : "IBRO",
      pins: [
      ],
      subnode: () => getAssignedPeripheral("LPTMR0").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("LPTMR0").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { datamodel: "LPTMR1", enable: "ENABLE", zephyr: "lptimer1", clock_mux : "MUX", clock_default : "IBRO",
      pins: [
      ],
      subnode: () => getAssignedPeripheral("LPTMR1").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("LPTMR1").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { datamodel: "LPUART0", enable: "ENABLE", zephyr: "uart3",
      pins: [
          { signal: "RX", pin: "C8", name: "lpuartb_rx_p2_6"},
          { signal: "TX", pin: "D5", name: "lpuartb_tx_p2_7"}
      ],
      config: [
          { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200" },
          { name: "hw-flow-control", type: "boolean", control: "HW_FLOW_CTRL", cfg_default: "DISABLED",
            value: x => x !== "DISABLED"},
          { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
            value: x => (x === "DISABLED" ? "none" : (x === "EVEN" ? "even" : "odd"))},
          { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
            value: x => (x === "1" ? "1" : (getAssignedPeripheral("LPUART0").Config?.CHAR_SIZE === "5" ? "1_5" : "2"))},
          { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5"}
      ]},
    { datamodel: "OWM", enable: "ENABLE", zephyr: "w1",
      pins: [
          { signal: "PE", pin: "A6", name: "owm_pe_p0_7"},
          { signal: "IO", pin: "B5", name: "owm_io_p0_6"}
      ],
      config : [
        { name: "internal-pullup", type: "int", control: "INTERNAL_PULL_UP", cfg_default: "0",
          value: x => (x === "TRUE" ? "1" : "0")
        },
        { name: "external-pullup", type: "int", control: "EXTERNAL_PULL_UP", cfg_default: "2",
          value: x => (x === "TRUE" ? (getAssignedPeripheral("OWM").Config?.EXT_PULL_UP_MODE === "ACTIVE_LOW" ? "1" : "0") : "2")
        },
        { name: "long-line-mode", type: "boolean", control: "LONG_LINE_MODE", cfg_default: false,
          value: x => (x === "LONG")
        }
      ]
    },
    { datamodel: "RTC", zephyr: "rtc_counter" },
    { datamodel: "SPI0", enable: "ENABLE", zephyr: "spi0",
      pins: [
          { signal: "CS1", pin: "A5", name: "spi0_ss1_p0_11"},
          { signal: "SCK", pin: "A6", name: "spi0_sck_p0_7"},
          { signal: "MOSI", pin: "A7", name: "spi0_mosi_p0_5"},
          { signal: "CS2", pin: "B4", name: "spi0_ss2_p0_10"},
          { signal: "MISO", pin: "B5", name: "spi0_miso_p0_6"},
          { signal: "CS0", pin: "D4", name: "spi0_ss0_p0_4"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "50000000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { datamodel: "SPI1", enable: "ENABLE", zephyr: "spi1",
      pins: [
          { signal: "MISO", pin: "A3", name: "spi1_miso_p0_22"},
          { signal: "CS1", pin: "B2", name: "spi1_ss1_p0_26"},
          { signal: "MOSI", pin: "B3", name: "spi1_mosi_p0_21"},
          { signal: "SCK", pin: "C2", name: "spi1_sck_p0_23"},
          { signal: "CS0", pin: "C3", name: "spi1_ss0_p0_20"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "50000000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { datamodel: "TMR0", enable: "TMR0_ENABLE", zephyr: "timer0", clock_mux : "TMR0a_MUX", clock_default : "PCLK",
      pins: [
          { signal: "IOBN", pin: "A7", name: "tmr0b_iobn_p0_5"},
          { signal: "IOB", pin: "B6", name: "ext_clk_p0_3"},
          { signal: "IOA", pin: "B7", name: "tmr0a_ioa_p0_2"},
          { signal: "IOAN", pin: "D4", name: "tmr0b_ioan_p0_4"}
      ],
      subnode: () => getAssignedPeripheral("TMR0").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR0").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { datamodel: "TMR1", enable: "TMR1_ENABLE", zephyr: "timer1", clock_mux : "TMR1a_MUX", clock_default : "PCLK",
      pins: [
          { signal: "IOAN", pin: "A3", name: "tmr1b_ioan_p0_22"},
          { signal: "IOAN", pin: "A4", name: "tmr1b_ioan_p0_12"},
          { signal: "IOB", pin: "B3", name: "tmr1b_iob_p0_21"},
          { signal: "IOBN", pin: "C2", name: "tmr1b_iobn_p0_23"},
          { signal: "IOA", pin: "C3", name: "tmr1b_ioa_p0_20"}
      ],
      subnode: () => getAssignedPeripheral("TMR1").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR1").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { datamodel: "TMR2", enable: "TMR2_ENABLE", zephyr: "timer2", clock_mux : "TMR2a_MUX", clock_default : "PCLK",
      pins: [
          { signal: "IOA", pin: "B2", name: "tmr2a_ioa_p0_26"}
      ],
      subnode: () => getAssignedPeripheral("TMR2").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR2").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { datamodel: "TMR3", enable: "TMR3_ENABLE", zephyr: "timer3", clock_mux : "TMR3a_MUX", clock_default : "PCLK",
      pins: [
          { signal: "IOA", pin: "C1", name: "tmr3a_ioa_p1_6"}
      ],
      subnode: () => getAssignedPeripheral("TMR3").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR3").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { datamodel: "TRNG", enable: "TRNG_ENABLE", zephyr: "trng" },
    { datamodel: "UART0", enable: "UART0_ENABLE", zephyr: "uart0", clock_mux: "UART0_MUX", clock_default: "PCLK",
      pins: [
          { signal: "RTS", pin: "B6", name: "uart0b_rts_p0_3"},
          { signal: "CTS", pin: "B7", name: "uart0b_cts_p0_2"},
          { signal: "RX", pin: "C6", name: "uart0a_rx_p0_0"},
          { signal: "TX", pin: "C7", name: "uart0a_tx_p0_1"}
      ],
      config: [
          { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200" },
          { name: "hw-flow-control", type: "boolean", control: "HW_FLOW_CTRL", cfg_default: "DISABLED",
            value: x => x !== "DISABLED"},
          { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
            value: x => (x === "DISABLED" ? "none" : (x === "EVEN" ? "even" : "odd"))},
          { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
            value: x => (x === "1" ? "1" : (getAssignedPeripheral("UART0").Config?.CHAR_SIZE === "5" ? "1_5" : "2"))},
          { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5"}
      ]},
    { datamodel: "WDT0", enable: "ENABLE", zephyr: "wdt0", clock_mux: "MUX", clock_default: "PCLK"},
    { datamodel: "LPWDT0", enable: "ENABLE", zephyr: "wdt1", clock_mux: "MUX", clock_default: "IBRO"}
  ];

}

unsupported_in_dts = [
    {datamodel: "ADC", diag: "The clock divider for ADC is not currently supported in devicetree.", ctrl: "DIV"},
    {clocknode: "ERFO Mux", diag: "Bypass of the ERFO is not currently supported in devicetree.", ctrl: "MUX", value: "ERFO_CLK"},
    {clocknode: "ERTCO Mux", diag: "Bypass of the ERTCO is not currently supported in devicetree.", ctrl: "MUX", value: "ERTCO_CLK"},
    {datamodel: "RTC", clocknode: "SQWOUT", diag: "Enabling SQWOUT from the RTC is not currently supported in devicetree.", ctrl: "SQWOUT", value: "1HZ"},
    {datamodel: "RTC", clocknode: "SQWOUT", diag: "Enabling SQWOUT from the RTC is not currently supported in devicetree.", ctrl: "SQWOUT", value: "512HZ"},
    {datamodel: "RTC", clocknode: "SQWOUT", diag: "Enabling SQWOUT from the RTC is not currently supported in devicetree.", ctrl: "SQWOUT", value: "4KHZ"},
    {datamodel: "RTC", clocknode: "SQWOUT", diag: "Enabling SQWOUT from the RTC is not currently supported in devicetree.", ctrl: "SQWOUT", value: "32KHZ"},
    {datamodel: "AESKEYS", clocknode: "AES", diag: "The Advanced Encryption Standard peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "BLE", diag: "The Bluetooth Low Energy peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "CRC", diag: "The Cyclic Redundancy Check peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "I2S", diag: "The Inter-IC Sound Interface peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "LPCMP", diag: "The Low-Power Comparator peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "SEMA", diag: "The Semaphore peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {clocknode: "LPM Mux", diag: "Setting the LPM Mux is not currently supported in devicetree.", ctrl: "MUX", value: "SYS_CLK_DIV_2_ISO"}
];

function mapClockName(clock) {
    if (clock === "EXT_CLK") {
        return "extclk";
    } else if (clock === "IBRO_DIV_8") {
        return "ibro";
    } else if (clock === "LPTMR0_CLK") {
        return undefined;
    } else if (clock === "LPTMR1_CLK") {
        return undefined;
    } else if (clock === "PCLK") {
        return undefined;
    }
    return clock.toLowerCase();
}

function getClocksUsed() {
    let clocksUsed = new Set();
    for (const peri of peripheralData) {
        if (peri.clock_mux && isPeripheralClockSetTo(peri.datamodel, peri.enable, "TRUE")) {
            const clockName = mapClockName(getPeripheralClockSetting(peri.datamodel, peri.clock_mux, peri.clock_default));
            if (clockName) {
                clocksUsed.add(clockName);
            }
        }
    }
    clocksUsed.add(mapClockName(getClockSetting("SYS_OSC Mux", "MUX", "IPO")));
    return Array.from(clocksUsed).sort();
}
