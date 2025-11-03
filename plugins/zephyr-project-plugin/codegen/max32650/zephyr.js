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

if (it.cfsconfig.Package.toUpperCase() === "TQFP") {

    peripheralData = [
        { zephyr: "i2c0", datamodel: "I2C0", enable: "I2C0_ENABLE",
        pins: [
            { signal: "SDA", pin: "129", name: "i2c0_sda_p2_7"},
            { signal: "SCL", pin: "130", name: "i2c0_scl_p2_8"}
        ],
        config : [
            { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
                value: x => convertToUnitsMacro(x, "FREQ", 1000)
            }
        ]},
        { zephyr: "i2c1", datamodel: "I2C1", enable: "I2C1_ENABLE",
        pins: [
            { signal: "SDA", pin: "19", name: "i2c1_sda_p2_17"},
            { signal: "SCL", pin: "20", name: "i2c1_scl_p2_18"}
        ],
        config : [
            { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
                value: x => convertToUnitsMacro(x, "FREQ", 1000)
            }
        ]},
        { datamodel: "RTC", zephyr: "rtc_counter" },
        { zephyr: "spi0", datamodel: "SPI0", enable: "SPI0_ENABLE",
        pins: [
          { signal: "CS0", pin: "10", name: "spi0_ss0_p0_22"},
          { signal: "MISO", pin: "138", name: "spi0_miso_p3_1"},
          { signal: "MOSI", pin: "141", name: "spi0_mosi_p3_2"},
          { signal: "SCK", pin: "142", name: "spi0_sck_p3_3"}
        ],
        config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "60000000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
        ]},
        { zephyr: "spi1", datamodel: "SPI1", enable: "SPI1_ENABLE",
        pins: [
          { signal: "SCK", pin: "115", name: "spi1_sck_p1_26"},
          { signal: "CS3", pin: "116", name: "spi1_ss3_p1_27"},
          { signal: "MISO", pin: "117", name: "spi1_miso_p1_28"},
          { signal: "MOSI", pin: "118", name: "spi1_mosi_p1_29"},
          { signal: "CS0", pin: "70", name: "spi1_ss0_p1_23"},
          { signal: "CS1", pin: "72", name: "spi1_ss1_p1_25"},
          { signal: "CS2", pin: "92", name: "spi1_ss2_p1_24"}
        ],
        config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "60000000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
        ]},
        { zephyr: "spi2", datamodel: "SPI2", enable: "SPI2_ENABLE",
        pins: [
          { signal: "CS2", pin: "120", name: "spi2_ss2_p2_0"},
          { signal: "CS1", pin: "121", name: "spi2_ss1_p2_1"},
          { signal: "SCK", pin: "122", name: "spi2_sck_p2_2"},
          { signal: "MISO", pin: "123", name: "spi2_miso_p2_3"},
          { signal: "MOSI", pin: "124", name: "spi2_mosi_p2_4"},
          { signal: "CS0", pin: "125", name: "spi2_ss0_p2_5"},
          { signal: "CS3", pin: "127", name: "spi2_ss3_p2_6"}
        ],
        config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "60000000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
        ]},
        { zephyr: "spi3", datamodel: "SPI3", enable: "SPI3_ENABLE",
        pins: [
          { signal: "CS1", pin: "25", name: "spi3_ss1_p0_13"},
          { signal: "CS2", pin: "26", name: "spi3_ss2_p0_14"},
          { signal: "SDIO3", pin: "28", name: "spi3_sdio3_p0_15"},
          { signal: "SCK", pin: "30", name: "spi3_sck_p0_16"},
          { signal: "SDIO2", pin: "31", name: "spi3_sdio2_p0_17"},
          { signal: "CS3", pin: "32", name: "spi3_ss3_p0_18"},
          { signal: "CS0", pin: "34", name: "spi3_ss0_p0_19"}
        ],
        config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "60000000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
        ]},
        { zephyr: "dma0", datamodel: "DMA", enable: "ENABLE"},
        { zephyr: "flc0", datamodel: "FLC", enable: "SFLC_ENABLE"},
        { zephyr: "timer0", datamodel: "TMR0", enable: "TMR0_ENABLE",
        pins: [
            { signal: "IOA", pin: "97", name: "tmr0_p3_4"}
        ],
        subnode: () => getAssignedPeripheral("TMR0").Config?.MODE === "COMPARE" ? "counter": "pwm",
        pins_node: () => getAssignedPeripheral("TMR0").Config?.MODE === "COMPARE" ? undefined : "subnode",
        config: [
            { name: "prescaler", type: "int", control: "CLKDIV", cfg_default: "1"}
        ]},
        { zephyr: "timer1", datamodel: "TMR1", enable: "TMR1_ENABLE",
        pins: [
            { signal: "IOA", pin: "96", name: "tmr1_p3_7"}
        ],
        subnode: () => getAssignedPeripheral("TMR1").Config?.MODE === "COMPARE" ? "counter": "pwm",
        pins_node: () => getAssignedPeripheral("TMR1").Config?.MODE === "COMPARE" ? undefined : "subnode",
        config: [
            { name: "prescaler", type: "int", control: "CLKDIV", cfg_default: "1"}
        ]},
        { zephyr: "timer2", datamodel: "TMR2", enable: "TMR2_ENABLE",
        pins: [
            { signal: "IOA", pin: "95", name: "tmr2_p3_5"}
        ],
        subnode: () => getAssignedPeripheral("TMR2").Config?.MODE === "COMPARE" ? "counter": "pwm",
        pins_node: () => getAssignedPeripheral("TMR2").Config?.MODE === "COMPARE" ? undefined : "subnode",
        config: [
            { name: "prescaler", type: "int", control: "CLKDIV", cfg_default: "1"}
        ]},
        { zephyr: "timer3", datamodel: "TMR3", enable: "TMR3_ENABLE",
        pins: [
            { signal: "IOA", pin: "94", name: "tmr3_p3_8"}
        ],
        subnode: () => getAssignedPeripheral("TMR3").Config?.MODE === "COMPARE" ? "counter": "pwm",
        pins_node: () => getAssignedPeripheral("TMR3").Config?.MODE === "COMPARE" ? undefined : "subnode",
        config: [
            { name: "prescaler", type: "int", control: "CLKDIV", cfg_default: "1"}
        ]},
        { zephyr: "timer4", datamodel: "TMR4", enable: "TMR4_ENABLE",
        pins: [
            { signal: "IOA", pin: "91", name: "tmr4_p3_6"}
        ],
        subnode: () => getAssignedPeripheral("TMR4").Config?.MODE === "COMPARE" ? "counter": "pwm",
        pins_node: () => getAssignedPeripheral("TMR4").Config?.MODE === "COMPARE" ? undefined : "subnode",
        config: [
            { name: "prescaler", type: "int", control: "CLKDIV", cfg_default: "1"}
        ]},
        { zephyr: "timer5", datamodel: "TMR5", enable: "TMR5_ENABLE",
        pins: [
            { signal: "IOA", pin: "90", name: "tmr5_p3_9"}
        ],
        subnode: () => getAssignedPeripheral("TMR5").Config?.MODE === "COMPARE" ? "counter": "pwm",
        pins_node: () => getAssignedPeripheral("TMR5").Config?.MODE === "COMPARE" ? undefined : "subnode",
        config: [
            { name: "prescaler", type: "int", control: "CLKDIV", cfg_default: "1"}
        ]},
        { zephyr: "uart0", datamodel: "UART0", enable: "UART0_ENABLE", clock_mux: "UART0_MUX", clock_default: "APBCLK",
        pins: [
            { signal: "CTS", pin: "131", name: "uart0_cts_p2_9"},
            { signal: "RX", pin: "132", name: "uart0_rx_p2_11"},
            { signal: "RTS", pin: "134", name: "uart0_rts_p2_10"},
            { signal: "TX", pin: "137", name: "uart0_tx_p2_12"}
        ],
        config: [
            { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200" },
            { name: "hw-flow-control", type: "boolean", control: "HW_FLOW_CTRL", cfg_default: "DISABLED",
                value: x => x !== "DISABLED"},
            { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
                value: x => (x === "DISABLED" ? "none" : x.toLowerCase()) },
            { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
                value: x => (x === "1" ? "1": (getAssignedPeripheral("UART0").Config?.CHAR_SIZE === "5" ? "1_5": "2"))},
            { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5"}
        ]},
        { zephyr: "uart1", datamodel: "UART1", enable: "UART1_ENABLE", clock_mux: "UART1_MUX", clock_default: "APBCLK",
        pins: [
            { signal: "TX", pin: "1", name: "uart1_tx_p2_16"},
            { signal: "CTS", pin: "140", name: "uart1_cts_p2_13"},
            { signal: "RX", pin: "143", name: "uart1_rx_p2_14"},
            { signal: "RTS", pin: "144", name: "uart1_rts_p2_15"}
        ],
        config: [
            { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200" },
            { name: "hw-flow-control", type: "boolean", control: "HW_FLOW_CTRL", cfg_default: "DISABLED",
                value: x => x !== "DISABLED"},
            { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
                value: x => (x === "DISABLED" ? "none" : x.toLowerCase()) },
            { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
                value: x => (x === "1" ? "1": (getAssignedPeripheral("UART1").Config?.CHAR_SIZE === "5" ? "1_5": "2"))},
            { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5"}
        ]},
        { zephyr: "uart2", datamodel: "UART2", enable: "UART2_ENABLE", clock_mux: "UART2_MUX", clock_default: "APBCLK",
        pins: [
            { signal: "CTS", pin: "38", name: "uart2_cts_p1_7"},
            { signal: "RTS", pin: "46", name: "uart2_rts_p1_8"},
            { signal: "RX", pin: "48", name: "uart2_rx_p1_9"},
            { signal: "TX", pin: "50", name: "uart2_tx_p1_10"}
        ],
        config: [
            { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200" },
            { name: "hw-flow-control", type: "boolean", control: "HW_FLOW_CTRL", cfg_default: "DISABLED",
                value: x => x !== "DISABLED"},
            { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
                value: x => (x === "DISABLED" ? "none" : x.toLowerCase()) },
            { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
                value: x => (x === "1" ? "1": (getAssignedPeripheral("UART2").Config?.CHAR_SIZE === "5" ? "1_5": "2"))},
            { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5"}
        ]},
        { datamodel: "WDT0", zephyr: "wdt0" },
        { datamodel: "WDT1", zephyr: "wdt1" }
    ];

} else {

    peripheralData = [
        { zephyr: "i2c1", datamodel: "I2C1", enable: "I2C1_ENABLE",
        pins: [
            { signal: "SDA", pin: "F2", name: "i2c1_sda_p2_17"},
            { signal: "SCL", pin: "H5", name: "i2c1_scl_p2_18"}
        ],
        config : [
            { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
                value: x => convertToUnitsMacro(x, "FREQ", 1000)
            }
        ]},
        { datamodel: "RTC", zephyr: "rtc_counter" },
        { zephyr: "spi1", datamodel: "SPI1", enable: "SPI1_ENABLE",
        pins: [
          { signal: "CS0", pin: "C7", name: "spi1_ss0_p1_23"},
          { signal: "CS1", pin: "D6", name: "spi1_ss1_p1_25"},
          { signal: "CS2", pin: "E7", name: "spi1_ss2_p1_24"},
          { signal: "MOSI", pin: "H6", name: "spi1_mosi_p1_29"},
          { signal: "CS3", pin: "H7", name: "spi1_ss3_p1_27"},
          { signal: "MISO", pin: "J7", name: "spi1_miso_p1_28"},
          { signal: "SCK", pin: "J8", name: "spi1_sck_p1_26"}
        ],
        config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "15000000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
        ]},
        { zephyr: "spi2", datamodel: "SPI2", enable: "SPI2_ENABLE",
        pins: [
          { signal: "CS0", pin: "H3", name: "spi2_ss0_p2_5"},
          { signal: "MOSI", pin: "H4", name: "spi2_mosi_p2_4"},
          { signal: "CS3", pin: "J4", name: "spi2_ss3_p2_6"},
          { signal: "MISO", pin: "J5", name: "spi2_miso_p2_3"},
          { signal: "CS2", pin: "J6", name: "spi2_ss2_p2_0"},
          { signal: "SCK", pin: "K6", name: "spi2_sck_p2_2"}
        ],
        config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "15000000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
        ]},
        { zephyr: "spi3", datamodel: "SPI3", enable: "SPI3_ENABLE",
        pins: [
          { signal: "CS2", pin: "D1", name: "spi3_ss2_p0_14"},
          { signal: "CS3", pin: "D2", name: "spi3_ss3_p0_18"},
          { signal: "CS1", pin: "E1", name: "spi3_ss1_p0_13"},
          { signal: "SDIO2", pin: "E3", name: "spi3_sdio2_p0_17"},
          { signal: "SCK", pin: "F3", name: "spi3_sck_p0_16"},
          { signal: "CS0", pin: "F4", name: "spi3_ss0_p0_19"},
          { signal: "SDIO3", pin: "G4", name: "spi3_sdio3_p0_15"}
        ],
        config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "15000000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
        ]},
        { zephyr: "dma0", datamodel: "DMA", enable: "ENABLE"},
        { zephyr: "flc0", datamodel: "FLC", enable: "SFLC_ENABLE"},
        { zephyr: "timer0", datamodel: "TMR0", enable: "TMR0_ENABLE",
        pins: [
            { signal: "IOA", pin: "F9", name: "tmr0_p3_4"}
        ],
        subnode: () => getAssignedPeripheral("TMR0").Config?.MODE === "COMPARE" ? "counter": "pwm",
        pins_node: () => getAssignedPeripheral("TMR0").Config?.MODE === "COMPARE" ? undefined : "subnode",
        config: [
            { name: "prescaler", type: "int", control: "CLKDIV", cfg_default: "1"}
        ]},
        { zephyr: "timer1", datamodel: "TMR1", enable: "TMR1_ENABLE",
        pins: [
            { signal: "IOA", pin: "F10", name: "tmr1_p3_7"}
        ],
        subnode: () => getAssignedPeripheral("TMR1").Config?.MODE === "COMPARE" ? "counter": "pwm",
        pins_node: () => getAssignedPeripheral("TMR1").Config?.MODE === "COMPARE" ? undefined : "subnode",
        config: [
            { name: "prescaler", type: "int", control: "CLKDIV", cfg_default: "1"}
        ]},
        { zephyr: "timer2", datamodel: "TMR2", enable: "TMR2_ENABLE",
        pins: [
            { signal: "IOA", pin: "E9", name: "tmr2_p3_5"}
        ],
        subnode: () => getAssignedPeripheral("TMR2").Config?.MODE === "COMPARE" ? "counter": "pwm",
        pins_node: () => getAssignedPeripheral("TMR2").Config?.MODE === "COMPARE" ? undefined : "subnode",
        config: [
            { name: "prescaler", type: "int", control: "CLKDIV", cfg_default: "1"}
        ]},
        { zephyr: "timer3", datamodel: "TMR3", enable: "TMR3_ENABLE",
        pins: [
            { signal: "IOA", pin: "E10", name: "tmr3_p3_8"}
        ],
        subnode: () => getAssignedPeripheral("TMR3").Config?.MODE === "COMPARE" ? "counter": "pwm",
        pins_node: () => getAssignedPeripheral("TMR3").Config?.MODE === "COMPARE" ? undefined : "subnode",
        config: [
            { name: "prescaler", type: "int", control: "CLKDIV", cfg_default: "1"}
        ]},
        { zephyr: "timer4", datamodel: "TMR4", enable: "TMR4_ENABLE",
        pins: [
            { signal: "IOA", pin: "D9", name: "tmr4_p3_6"}
        ],
        subnode: () => getAssignedPeripheral("TMR4").Config?.MODE === "COMPARE" ? "counter": "pwm",
        pins_node: () => getAssignedPeripheral("TMR4").Config?.MODE === "COMPARE" ? undefined : "subnode",
        config: [
            { name: "prescaler", type: "int", control: "CLKDIV", cfg_default: "1"}
        ]},
        { zephyr: "timer5", datamodel: "TMR5", enable: "TMR5_ENABLE",
        pins: [
            { signal: "IOA", pin: "D10", name: "tmr5_p3_9"}
        ],
        subnode: () => getAssignedPeripheral("TMR5").Config?.MODE === "COMPARE" ? "counter": "pwm",
        pins_node: () => getAssignedPeripheral("TMR5").Config?.MODE === "COMPARE" ? undefined : "subnode",
        config: [
            { name: "prescaler", type: "int", control: "CLKDIV", cfg_default: "1"}
        ]},
        { zephyr: "uart0", datamodel: "UART0", enable: "UART0_ENABLE", clock_mux: "UART0_MUX", clock_default: "APBCLK",
        pins: [
            { signal: "TX", pin: "H2", name: "uart0_tx_p2_12"},
            { signal: "RX", pin: "K3", name: "uart0_rx_p2_11"}
        ],
        config: [
            { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200" },
            { name: "hw-flow-control", type: "boolean", control: "HW_FLOW_CTRL", cfg_default: "DISABLED",
                value: x => x !== "DISABLED"},
            { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
                value: x => (x === "DISABLED" ? "none" : x.toLowerCase()) },
            { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
                value: x => (x === "1" ? "1": (getAssignedPeripheral("UART0").Config?.CHAR_SIZE === "5" ? "1_5": "2"))},
            { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5"}
        ]},
        { zephyr: "uart1", datamodel: "UART1", enable: "UART1_ENABLE", clock_mux: "UART1_MUX", clock_default: "APBCLK",
        pins: [
            { signal: "TX", pin: "G2", name: "uart1_tx_p2_16"},
            { signal: "CTS", pin: "G3", name: "uart1_cts_p2_13"},
            { signal: "RTS", pin: "H1", name: "uart1_rts_p2_15"},
            { signal: "RX", pin: "J1", name: "uart1_rx_p2_14"}
        ],
        config: [
            { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200" },
            { name: "hw-flow-control", type: "boolean", control: "HW_FLOW_CTRL", cfg_default: "DISABLED",
                value: x => x !== "DISABLED"},
            { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
                value: x => (x === "DISABLED" ? "none" : x.toLowerCase()) },
            { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
                value: x => (x === "1" ? "1": (getAssignedPeripheral("UART1").Config?.CHAR_SIZE === "5" ? "1_5": "2"))},
            { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5"}
        ]},
        { zephyr: "uart2", datamodel: "UART2", enable: "UART2_ENABLE", clock_mux: "UART2_MUX", clock_default: "APBCLK",
        pins: [
            { signal: "TX", pin: "A4", name: "uart2_tx_p1_10"},
            { signal: "RX", pin: "B3", name: "uart2_rx_p1_9"}
        ],
        config: [
            { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200" },
            { name: "hw-flow-control", type: "boolean", control: "HW_FLOW_CTRL", cfg_default: "DISABLED",
                value: x => x !== "DISABLED"},
            { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
                value: x => (x === "DISABLED" ? "none" : x.toLowerCase()) },
            { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
                value: x => (x === "1" ? "1": (getAssignedPeripheral("UART2").Config?.CHAR_SIZE === "5" ? "1_5": "2"))},
            { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5"}
        ]},
        { datamodel: "WDT0", zephyr: "wdt0" },
        { datamodel: "WDT1", zephyr: "wdt1" }
    ];

}

unsupported_in_dts = [
    {datamodel: "ADC", diag: "The ADC peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "ADC", diag: "The clock divider for ADC is not currently supported in devicetree.", ctrl: "DIV"},
    {datamodel: "CLCD", diag: "The Color LCD-TFT Controller peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "SDMA", diag: "The Smart Direct Memory Access peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "FLC", diag: "The Flash Instruction Cache is not currently supported in devicetree.", ctrl: "FIC_ENABLE", value: "TRUE"},
    {datamodel: "HBMC", diag: "The HyperBus/Xccela Controller peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "EMCC", diag: "The External Memory Cache Controller is not currently supported in devicetree.", ctrl: "EMCC_ENABLE", value: "TRUE"},
    {datamodel: "ICC0", diag: "The Instruction Cache Controller peripheral is not currently supported in devicetree.", ctrl: "ICC_ENABLE", value: "TRUE"},
    {datamodel: "ICC1", diag: "The Instruction Cache Controller peripheral is not currently supported in devicetree.", ctrl: "ICC_ENABLE", value: "TRUE"},
    {datamodel: "OWM", diag: "The 1-Wire Controller peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "PT0", diag: "The Pulse Train Engines peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "PT1", diag: "The Pulse Train Engines peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "PT10", diag: "The Pulse Train Engines peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "PT11", diag: "The Pulse Train Engines peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "PT12", diag: "The Pulse Train Engines peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "PT13", diag: "The Pulse Train Engines peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "PT14", diag: "The Pulse Train Engines peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "PT15", diag: "The Pulse Train Engines peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "PT2", diag: "The Pulse Train Engines peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "PT3", diag: "The Pulse Train Engines peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "PT4", diag: "The Pulse Train Engines peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "PT5", diag: "The Pulse Train Engines peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "PT6", diag: "The Pulse Train Engines peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "PT7", diag: "The Pulse Train Engines peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "PT8", diag: "The Pulse Train Engines peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "PT9", diag: "The Pulse Train Engines peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "PTG", diag: "The Power Sequencer peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "SDHC", diag: "The Secure Digital Host Controller peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "SEMA", diag: "The Semaphore Peripheral peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "SMON", diag: "The Power Sequencer peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "SPIMSS", diag: "The Inter-IC Sound Interface peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "SPIXF", diag: "The SPI Execute-In-Place Flash peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "SPIXFC", diag: "The Power Sequencer peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "SPIXR", diag: "The SPI Execute-In-Place RAM peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "High-Speed USB", diag: "The High-Speed USB peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "RTC", clocknode: "32KCAL", diag: "Enabling 32KCAL from the RTC is not currently supported in devicetree.", ctrl: "32KCAL", value: "1HZ"},
    {datamodel: "RTC", clocknode: "32KCAL", diag: "Enabling 32KCAL from the RTC is not currently supported in devicetree.", ctrl: "32KCAL", value: "512HZ"},
    {datamodel: "RTC", clocknode: "32KCAL", diag: "Enabling 32KCAL from the RTC is not currently supported in devicetree.", ctrl: "32KCAL", value: "4KHZ"},
    {datamodel: "RTC", clocknode: "32KCAL", diag: "Enabling 32KCAL from the RTC is not currently supported in devicetree.", ctrl: "32KCAL", value: "32KHZ"},
    {clocknode: "ERTCO Mux", diag: "Bypass of the ERTCO is not currently supported in devicetree.", ctrl: "MUX", value: "ERTCO_CLK"}
];

function mapClockName(clock) {
    if (clock === "HSCLK") {
        return "ipo";
    } else if (clock === "LPCLK") {
        return "iso";
    } else if (clock === "7MCLK") {
        return "ibro";
    } else if (clock === "APBCLK") {
        return undefined;
    } else {
    return clock.toLowerCase();
    }
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
