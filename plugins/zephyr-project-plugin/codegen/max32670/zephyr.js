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

if (it.cfsconfig.Package.toUpperCase() === "TQFN") {

  peripheralData = [
      { zephyr: "dma0", datamodel: "DMA", enable: "ENABLE"},
      { zephyr: "flc0", datamodel: "FLC0"},
      { zephyr: "i2c0", datamodel: "I2C0", enable: "I2C0_ENABLE",
        pins: [
            { signal: "SCL", pin: "10", name: "i2c0_scl_p0_6"},
            { signal: "SDA", pin: "11", name: "i2c0_sda_p0_7"}
        ],
        config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)
          }
        ]},
      { zephyr: "i2c1", datamodel: "I2C1", enable: "I2C1_ENABLE",
        pins: [
            { signal: "SCL", pin: "24", name: "i2c1_scl_p0_12"},
            { signal: "SDA", pin: "25", name: "i2c1_sda_p0_13"}
        ],
        config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)
          }
        ]},
      { zephyr: "i2c2", datamodel: "I2C2", enable: "I2C2_ENABLE",
        pins: [
            { signal: "SCL", pin: "30", name: "i2c2_scl_p0_18"},
            { signal: "SDA", pin: "31", name: "i2c2_sda_p0_19"}
        ],
        config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)
          }
        ]},
      { zephyr: "lptimer0", datamodel: "LPTMR0", enable: "ENABLE", clock_mux: "MUX", clock_default: "ERTCO",
        pins: [
            { signal: "IA", pin: "10", name: "lptmr0b_ia_p0_6"},
            { signal: "OA", pin: "11", name: "lptmr0b_oa_p0_7"}
        ],
        subnode: () => getAssignedPeripheral("LPTMR0").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
        pins_node: () => getAssignedPeripheral("LPTMR0").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
        config: [
            { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
        ]},
      { zephyr: "lptimer1", datamodel: "LPTMR1", enable: "ENABLE", clock_mux: "MUX", clock_default: "ERTCO",
        pins: [
            { signal: "OA", pin: "12", name: "lptmr1a_oa_p0_23"},
            { signal: "IA", pin: "3", name: "lptmr1a_ia_p0_22"}
        ],
        subnode: () => getAssignedPeripheral("LPTMR1").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
        pins_node: () => getAssignedPeripheral("LPTMR1").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
        config: [
            { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
        ]},
      { datamodel: "RTC", zephyr: "rtc_counter" },
      { zephyr: "spi0", datamodel: "SPI0", enable: "SPI0_ENABLE",
        pins: [
            { signal: "MISO", pin: "6", name: "spi0_miso_p0_2"},
            { signal: "MOSI", pin: "7", name: "spi0_mosi_p0_3"},
            { signal: "SCK", pin: "8", name: "spi0_sck_p0_4"},
            { signal: "CS0", pin: "9", name: "spi0_ss0_p0_5"}
        ],
        config: [
            { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "15000000",
              value: x => convertToUnitsMacro(x, "FREQ", 1000)}
        ]},
      { zephyr: "spi1", datamodel: "SPI1", enable: "SPI1_ENABLE",
        pins: [
            { signal: "CS0", pin: "25", name: "spi1_ss0_p0_13"},
            { signal: "MISO", pin: "26", name: "spi1_miso_p0_14"},
            { signal: "MOSI", pin: "27", name: "spi1_mosi_p0_15"},
            { signal: "SCK", pin: "28", name: "spi1_sck_p0_16"},
            { signal: "CS0", pin: "29", name: "spi1_ss0_p0_17"}
        ],
        config: [
            { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "15000000",
              value: x => convertToUnitsMacro(x, "FREQ", 1000)}
        ]},
      { zephyr: "timer0", datamodel: "TMR0", enable: "TMR0_ENABLE", clock_mux: "TMR0a_MUX", clock_default: "PCLK",
        pins: [
            { signal: "IA", pin: "13", name: "tmr0c_ia_p0_24"},
            { signal: "OA", pin: "14", name: "tmr0c_oa_p0_25"},
            { signal: "IA", pin: "20", name: "tmr0c_ia_p0_8"},
            { signal: "OA", pin: "21", name: "tmr0c_oa_p0_9"},
            { signal: "IA", pin: "28", name: "tmr0c_ia_p0_16"},
            { signal: "OA", pin: "29", name: "tmr0c_oa_p0_17"},
            { signal: "IA", pin: "4", name: "tmr0c_ia_p0_0"}
        ],
        subnode: () => getAssignedPeripheral("TMR0").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
        pins_node: () => getAssignedPeripheral("TMR0").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
        config: [
            { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
        ]},
      { zephyr: "timer1", datamodel: "TMR1", enable: "TMR1_ENABLE", clock_mux: "TMR1a_MUX", clock_default: "PCLK",
        pins: [
            { signal: "IA", pin: "15", name: "tmr1c_ia_p0_26"},
            { signal: "OA", pin: "16", name: "tmr1c_oa_p0_27"},
            { signal: "IA", pin: "22", name: "tmr1c_ia_p0_10"},
            { signal: "OA", pin: "23", name: "tmr1c_oa_p0_11"},
            { signal: "IA", pin: "30", name: "tmr1c_ia_p0_18"},
            { signal: "OA", pin: "31", name: "tmr1c_oa_p0_19"},
            { signal: "IA", pin: "6", name: "tmr1c_ia_p0_2"},
            { signal: "OA", pin: "7", name: "tmr1c_oa_p0_3"}
        ],
        subnode: () => getAssignedPeripheral("TMR1").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
        pins_node: () => getAssignedPeripheral("TMR1").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
        config: [
            { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
        ]},
      { zephyr: "timer2", datamodel: "TMR2", enable: "TMR2_ENABLE", clock_mux: "TMR2a_MUX", clock_default: "PCLK",
        pins: [
            { signal: "IA", pin: "1", name: "tmr2c_ia_p0_20"},
            { signal: "IA", pin: "17", name: "tmr2c_ia_p0_28"},
            { signal: "OA", pin: "18", name: "tmr2c_oa_p0_29"},
            { signal: "OA", pin: "2", name: "tmr2c_oa_p0_21"},
            { signal: "IA", pin: "24", name: "tmr2c_ia_p0_12"},
            { signal: "OA", pin: "25", name: "tmr2c_oa_p0_13"},
            { signal: "IA", pin: "8", name: "tmr2c_ia_p0_4"},
            { signal: "OA", pin: "9", name: "tmr2c_oa_p0_5"}
        ],
        subnode: () => getAssignedPeripheral("TMR2").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
        pins_node: () => getAssignedPeripheral("TMR2").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
        config: [
            { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
        ]},
      { zephyr: "timer3", datamodel: "TMR3", enable: "TMR3_ENABLE", clock_mux: "TMR3a_MUX", clock_default: "PCLK",
        pins: [
            { signal: "IA", pin: "10", name: "tmr3c_ia_p0_6"},
            { signal: "OA", pin: "11", name: "tmr3c_oa_p0_7"},
            { signal: "OA", pin: "12", name: "tmr3c_oa_p0_23"},
            { signal: "IA", pin: "19", name: "tmr3c_ia_p0_30"},
            { signal: "IA", pin: "26", name: "tmr3c_ia_p0_14"},
            { signal: "OA", pin: "27", name: "tmr3c_oa_p0_15"},
            { signal: "IA", pin: "3", name: "tmr3c_ia_p0_22"}
        ],
        subnode: () => getAssignedPeripheral("TMR3").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
        pins_node: () => getAssignedPeripheral("TMR3").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
        config: [
            { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
        ]},
      { zephyr: "trng", datamodel: "TRNG", enable: "TRNG_ENABLE"},
      { zephyr: "uart0", datamodel: "UART0", enable: "UART0_ENABLE", clock_mux: "UART0_MUX", clock_default: "PCLK",
        pins: [
            { signal: "RX", pin: "13", name: "uart0b_rx_p0_24"},
            { signal: "TX", pin: "14", name: "uart0b_tx_p0_25"},
            { signal: "CTS", pin: "15", name: "uart0b_cts_p0_26"},
            { signal: "RTS", pin: "16", name: "uart0b_rts_p0_27"},
            { signal: "RX", pin: "20", name: "uart0a_rx_p0_8"},
            { signal: "TX", pin: "21", name: "uart0a_tx_p0_9"},
            { signal: "CTS", pin: "22", name: "uart0a_cts_p0_10"},
            { signal: "RTS", pin: "23", name: "uart0a_rts_p0_11"}
        ],
        config: [
            { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200"},
            { name: "hw-flow-control", type: "boolean", control: "HW_FLOW_CTRL", cfg_default: "DISABLED",
              value: x => x !== "DISABLED"},
            { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
              value: x => (x === "DISABLED" ? "none" : (x === "EVEN" ? "even" : "odd"))},
            { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
              value: x => (x === "1" ? "1" : getAssignedPeripheral("UART0").Config?.CHAR_SIZE === "5" ? "1_5" : "2")},
            { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5"}
        ]},
      { zephyr: "uart1", datamodel: "UART1", enable: "UART1_ENABLE", clock_mux: "UART1_MUX", clock_default: "PCLK",
        pins: [
            { signal: "RX", pin: "17", name: "uart1a_rx_p0_28"},
            { signal: "TX", pin: "18", name: "uart1a_tx_p0_29"},
            { signal: "CTS", pin: "19", name: "uart1a_cts_p0_30"},
            { signal: "RX", pin: "6", name: "uart1b_rx_p0_2"},
            { signal: "TX", pin: "7", name: "uart1b_tx_p0_3"},
            { signal: "CTS", pin: "8", name: "uart1b_cts_p0_4"},
            { signal: "RTS", pin: "9", name: "uart1b_rts_p0_5"}
        ],
        config: [
            { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200"},
            { name: "hw-flow-control", type: "boolean", control: "HW_FLOW_CTRL", cfg_default: "DISABLED",
              value: x => x !== "DISABLED"},
            { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
              value: x => (x === "DISABLED" ? "none" : (x === "EVEN" ? "even" : "odd"))},
            { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
              value: x => (x === "1" ? "1" : getAssignedPeripheral("UART1").Config?.CHAR_SIZE === "5" ? "1_5" : "2")},
            { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5"}
        ]},
      { zephyr: "uart2", datamodel: "UART2", enable: "UART2_ENABLE", clock_mux: "UART2_MUX", clock_default: "PCLK",
        pins: [
            { signal: "RX", pin: "26", name: "uart2b_rx_p0_14"},
            { signal: "TX", pin: "27", name: "uart2b_tx_p0_15"},
            { signal: "CTS", pin: "28", name: "uart2b_cts_p0_16"},
            { signal: "RTS", pin: "29", name: "uart2b_rts_p0_17"}
        ],
        config: [
            { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200"},
            { name: "hw-flow-control", type: "boolean", control: "HW_FLOW_CTRL", cfg_default: "DISABLED",
              value: x => x !== "DISABLED"},
            { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
              value: x => (x === "DISABLED" ? "none" : (x === "EVEN" ? "even" : "odd"))},
            { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
              value: x => (x === "1" ? "1" : getAssignedPeripheral("UART2").Config?.CHAR_SIZE === "5" ? "1_5" : "2")},
            { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5"}
        ]},
      { zephyr: "uart3", datamodel: "LPUART0", enable: "ENABLE", clock_mux: "MUX", clock_default: "ERTCO",
        pins: [
            { signal: "CTS", pin: "13", name: "lpuart0_cts_p0_24"},
            { signal: "RTS", pin: "14", name: "lpuart0_rts_p0_25"},
            { signal: "RX", pin: "15", name: "lpuart0_rx_p0_26"},
            { signal: "TX", pin: "16", name: "lpuart0_tx_p0_27"}
        ],
        config: [
            { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200"},
            { name: "hw-flow-control", type: "boolean", control: "HW_FLOW_CTRL", cfg_default: "DISABLED",
              value: x => x !== "DISABLED"},
            { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
              value: x => (x === "DISABLED" ? "none" : (x === "EVEN" ? "even" : "odd"))},
            { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
              value: x => (x === "1" ? "1" : getAssignedPeripheral("LPUART0").Config?.CHAR_SIZE === "5" ? "1_5" : "2")},
            { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5"}
        ]},
      { zephyr: "wdt0", datamodel: "WDT0", enable: "WDT0_ENABLE", clock_mux: "WDT0_MUX", clock_default: "PCLK"},
      { zephyr: "wdt1", datamodel: "WDT1", enable: "WDT1_ENABLE", clock_mux: "WDT1_MUX", clock_default: "PCLK"}
  ];

} else if (it.cfsconfig.Package.toUpperCase() === "WLP") {

  peripheralData = [
      { zephyr: "dma0", datamodel: "DMA", enable: "ENABLE"},
      { zephyr: "flc0", datamodel: "FLC0"},
      { zephyr: "i2c0", datamodel: "I2C0", enable: "I2C0_ENABLE",
        pins: [
            { signal: "SDA", pin: "A6", name: "i2c0_sda_p0_7"},
            { signal: "SCL", pin: "B6", name: "i2c0_scl_p0_6"}
        ],
        config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)
          }
        ]},
      { zephyr: "i2c1", datamodel: "I2C1", enable: "I2C1_ENABLE",
        pins: [
            { signal: "SCL", pin: "C4", name: "i2c1_scl_p0_12"},
            { signal: "SDA", pin: "D4", name: "i2c1_sda_p0_13"}
        ],
        config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)
          }
        ]},
      { zephyr: "lptimer0", datamodel: "LPTMR0", enable: "ENABLE", clock_mux: "MUX", clock_default: "ERTCO",
        pins: [
            { signal: "OA", pin: "A6", name: "lptmr0b_oa_p0_7"},
            { signal: "IA", pin: "B6", name: "lptmr0b_ia_p0_6"}
        ],
        subnode: () => getAssignedPeripheral("LPTMR0").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
        pins_node: () => getAssignedPeripheral("LPTMR0").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
        config: [
            { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
        ]},
      { datamodel: "RTC", zephyr: "rtc_counter" },
      { zephyr: "spi0", datamodel: "SPI0", enable: "SPI0_ENABLE",
        pins: [
            { signal: "MISO", pin: "A4", name: "spi0_miso_p0_2"},
            { signal: "SCK", pin: "A5", name: "spi0_sck_p0_4"},
            { signal: "MOSI", pin: "B4", name: "spi0_mosi_p0_3"},
            { signal: "CS0", pin: "B5", name: "spi0_ss0_p0_5"}
        ],
        config: [
            { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "15000000",
              value: x => convertToUnitsMacro(x, "FREQ", 1000)}
        ]},
      { zephyr: "spi1", datamodel: "SPI1", enable: "SPI1_ENABLE",
        pins: [
            { signal: "MISO", pin: "C3", name: "spi1_miso_p0_14"},
            { signal: "MOSI", pin: "D2", name: "spi1_mosi_p0_15"},
            { signal: "SCK", pin: "D3", name: "spi1_sck_p0_16"},
            { signal: "CS0", pin: "D4", name: "spi1_ss0_p0_13"}
        ],
        config: [
            { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "15000000",
              value: x => convertToUnitsMacro(x, "FREQ", 1000)}
        ]},
      { zephyr: "timer0", datamodel: "TMR0", enable: "TMR0_ENABLE", clock_mux: "TMR0a_MUX", clock_default: "PCLK",
        pins: [
            { signal: "IA", pin: "A3", name: "tmr0c_ia_p0_0"},
            { signal: "OA", pin: "C6", name: "tmr0c_oa_p0_9"},
            { signal: "IA", pin: "D3", name: "tmr0c_ia_p0_16"},
            { signal: "IA", pin: "D6", name: "tmr0c_ia_p0_8"}
        ],
        subnode: () => getAssignedPeripheral("TMR0").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
        pins_node: () => getAssignedPeripheral("TMR0").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
        config: [
            { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
        ]},
      { zephyr: "timer1", datamodel: "TMR1", enable: "TMR1_ENABLE", clock_mux: "TMR1a_MUX", clock_default: "PCLK",
        pins: [
            { signal: "IA", pin: "A4", name: "tmr1c_ia_p0_2"},
            { signal: "OA", pin: "B4", name: "tmr1c_oa_p0_3"},
            { signal: "OA", pin: "C5", name: "tmr1c_oa_p0_11"},
            { signal: "IA", pin: "D5", name: "tmr1c_ia_p0_10"}
        ],
        subnode: () => getAssignedPeripheral("TMR1").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
        pins_node: () => getAssignedPeripheral("TMR1").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
        config: [
            { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
        ]},
      { zephyr: "timer2", datamodel: "TMR2", enable: "TMR2_ENABLE", clock_mux: "TMR2a_MUX", clock_default: "PCLK",
        pins: [
            { signal: "IA", pin: "A5", name: "tmr2c_ia_p0_4"},
            { signal: "OA", pin: "B5", name: "tmr2c_oa_p0_5"},
            { signal: "IA", pin: "C4", name: "tmr2c_ia_p0_12"},
            { signal: "OA", pin: "D4", name: "tmr2c_oa_p0_13"}
        ],
        subnode: () => getAssignedPeripheral("TMR2").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
        pins_node: () => getAssignedPeripheral("TMR2").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
        config: [
            { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
        ]},
      { zephyr: "timer3", datamodel: "TMR3", enable: "TMR3_ENABLE", clock_mux: "TMR3a_MUX", clock_default: "PCLK",
        pins: [
            { signal: "OA", pin: "A6", name: "tmr3c_oa_p0_7"},
            { signal: "IA", pin: "B6", name: "tmr3c_ia_p0_6"},
            { signal: "IA", pin: "C3", name: "tmr3c_ia_p0_14"},
            { signal: "OA", pin: "D2", name: "tmr3c_oa_p0_15"}
        ],
        subnode: () => getAssignedPeripheral("TMR3").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
        pins_node: () => getAssignedPeripheral("TMR3").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
        config: [
            { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
        ]},
      { zephyr: "trng", datamodel: "TRNG", enable: "TRNG_ENABLE"},
      { zephyr: "uart0", datamodel: "UART0", enable: "UART0_ENABLE", clock_mux: "UART0_MUX", clock_default: "PCLK",
        pins: [
            { signal: "RTS", pin: "C5", name: "uart0a_rts_p0_11"},
            { signal: "TX", pin: "C6", name: "uart0a_tx_p0_9"},
            { signal: "CTS", pin: "D5", name: "uart0a_cts_p0_10"},
            { signal: "RX", pin: "D6", name: "uart0a_rx_p0_8"}
        ],
        config: [
            { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200"},
            { name: "hw-flow-control", type: "boolean", control: "HW_FLOW_CTRL", cfg_default: "DISABLED",
              value: x => x !== "DISABLED"},
            { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
              value: x => (x === "DISABLED" ? "none" : (x === "EVEN" ? "even" : "odd"))},
            { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
              value: x => (x === "1" ? "1" : getAssignedPeripheral("UART0").Config?.CHAR_SIZE === "5" ? "1_5" : "2")},
            { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5"}
        ]},
      { zephyr: "uart1", datamodel: "UART1", enable: "UART1_ENABLE", clock_mux: "UART1_MUX", clock_default: "PCLK",
        pins: [
            { signal: "RX", pin: "A4", name: "uart1b_rx_p0_2"},
            { signal: "CTS", pin: "A5", name: "uart1b_cts_p0_4"},
            { signal: "TX", pin: "B4", name: "uart1b_tx_p0_3"},
            { signal: "RTS", pin: "B5", name: "uart1b_rts_p0_5"}
        ],
        config: [
            { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200"},
            { name: "hw-flow-control", type: "boolean", control: "HW_FLOW_CTRL", cfg_default: "DISABLED",
              value: x => x !== "DISABLED"},
            { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
              value: x => (x === "DISABLED" ? "none" : (x === "EVEN" ? "even" : "odd"))},
            { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
              value: x => (x === "1" ? "1" : getAssignedPeripheral("UART1").Config?.CHAR_SIZE === "5" ? "1_5" : "2")},
            { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5"}
        ]},
      { zephyr: "uart2", datamodel: "UART2", enable: "UART2_ENABLE", clock_mux: "UART2_MUX", clock_default: "PCLK",
        pins: [
            { signal: "RX", pin: "C3", name: "uart2b_rx_p0_14"},
            { signal: "TX", pin: "D2", name: "uart2b_tx_p0_15"},
            { signal: "CTS", pin: "D3", name: "uart2b_cts_p0_16"}
        ],
        config: [
            { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200"},
            { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
              value: x => (x === "DISABLED" ? "none" : (x === "EVEN" ? "even" : "odd"))},
            { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
              value: x => (x === "1" ? "1" : getAssignedPeripheral("UART2").Config?.CHAR_SIZE === "5" ? "1_5" : "2")},
            { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5"}
        ]},
      { zephyr: "wdt0", datamodel: "WDT0", enable: "WDT0_ENABLE", clock_mux: "MUX", clock_default: "PCLK"},
      { zephyr: "wdt1", datamodel: "WDT1", enable: "WDT1_ENABLE", clock_mux: "WDT1_MUX", clock_default: "PCLK"}
  ];

}

unsupported_in_dts = [
    {datamodel: "AES", diag: "The Advanced Encryption Standard peripheral is not currently supported in devicetree.", ctrl: "AES_ENABLE", value: "TRUE"},
    {datamodel: "CRC", diag: "The Cyclic Redundancy Check peripheral is not currently supported in devicetree.", ctrl: "CRC_ENABLE", value: "TRUE"},
    {datamodel: "I2S0", diag: "The Inter-IC Sound Interface peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "ICC", diag: "The Instruction Cache Controller peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "RTC", clocknode: "32KCAL", diag: "Enabling 32KCAL from the RTC is not currently supported in devicetree.", ctrl: "SQWOUT", value: "1HZ" },
    {datamodel: "RTC", clocknode: "32KCAL", diag: "Enabling 32KCAL from the RTC is not currently supported in devicetree.", ctrl: "SQWOUT", value: "512HZ" },
    {datamodel: "RTC", clocknode: "32KCAL", diag: "Enabling 32KCAL from the RTC is not currently supported in devicetree.", ctrl: "SQWOUT", value: "4KHZ" },
    {datamodel: "RTC", clocknode: "32KCAL", diag: "Enabling 32KCAL from the RTC is not currently supported in devicetree.", ctrl: "SQWOUT", value: "32KHZ" },
    {clocknode: "ERTCO Mux", diag: "Bypass of the ERTCO is not currently supported in devicetree.", ctrl: "MUX", value: "ERTCO_CLK" },
    {clocknode: "DIV_CLK_OUT_MUX", diag: "Changing value of the DIV_CLK_OUT_MUX is not currently supported in devicetree.", ctrl: "MUX", value: "IBRO_BY_4" },
    {clocknode: "DIV_CLK_OUT_MUX", diag: "Changing value of the DIV_CLK_OUT_MUX is not currently supported in devicetree.", ctrl: "MUX", value: "IBRO_BY_8" },
    {clocknode: "AOD_CLK_DIV", diag: "Setting divide value on AOD from the GCR is not currently supported in devicetree.", ctrl: "DIV", value: "4" },
    {clocknode: "AOD_CLK_DIV", diag: "Setting divide value on AOD from the GCR is not currently supported in devicetree.", ctrl: "DIV", value: "8" },
    {clocknode: "AOD_CLK_DIV", diag: "Setting divide value on AOD from the GCR is not currently supported in devicetree.", ctrl: "DIV", value: "16" },
    {clocknode: "AOD_CLK_DIV", diag: "Setting divide value on AOD from the GCR is not currently supported in devicetree.", ctrl: "DIV", value: "32" },
    {clocknode: "ERFO Mux", diag: "Bypass of the ERFO is not currently supported in devicetree.", ctrl: "MUX", value: "ERFO_CLK" },
    {clocknode: "HFXIN", diag: "The value modeled internally for the HFXIN clock frequency is always 32000000.", ctrl: "HFXIN_FREQ", default_value: "32000000" }
];

function mapClockName(clock) {
    if (clock === "EXT_CLK1" || clock === "EXT_CLK2") {
        return "extclk";
    } else if (clock === "PRESCALED IPO") {
        return "ipo";
    } else if (clock === "AOD_CLK") {
        return undefined;
    } else if (clock === "PCLK") {
        return undefined;
    } else if (clock === "SYS_CLK") {
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
