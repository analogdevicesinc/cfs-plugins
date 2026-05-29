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

if (it.cfsconfig.Package.toUpperCase() === "TQFNEP") {
    peripheralData = [
        { zephyr: "adc", datamodel: "ADC", enable: "ENABLE", clock_mux: "MUX", clock_default: "SYS_OSC",
        pins: [
            { signal: "TRIG_C", pin: "16", name: "adc_trig_c_p0_17"},
            { signal: "TRIG_D", pin: "18", name: "adc_trig_d_p0_9"},
            { signal: "AIN3", pin: "21", name: "ain3_p0_10"},
            { signal: "AIN2", pin: "22", name: "ain2_p0_11"},
            { signal: "AIN1", pin: "23", name: "ain1_p0_12"},
            { signal: "AIN0", pin: "24", name: "ain0_p0_13"},
            { signal: "TRIG_E", pin: "3", name: "adc_trig_e_p0_0"}
        ],
        config: [
            { name: "clock-divider", type: "int", clocknode: "ADC", control: "DIV", cfg_default: "16"},
            { name: "track-count", type: "int", control: "TRACK_CNT", cfg_default: "0"},
            { name: "idle-count", type: "int", control: "IDLE_CNT", cfg_default: "0"}
        ]},
        { zephyr: "can0", datamodel: "CAN", enable: "ENABLE",
        pins: [
            { signal: "RX", pin: "11", name: "can0b_rx_p0_6"},
            { signal: "TX", pin: "18", name: "can0b_tx_p0_9"},
            { signal: "RX", pin: "8", name: "can0b_rx_p0_15"},
            { signal: "TX", pin: "9", name: "can0b_tx_p0_16"}
        ]},
        { zephyr: "dma0", datamodel: "DMA", enable: "ENABLE"},
        { zephyr: "flc0", datamodel: "FLC"},
        { zephyr: "i2c0", datamodel: "I2C0", enable: "I2C0_ENABLE",
        pins: [
            { signal: "SCL", pin: "23", name: "i2c0a_scl_p0_12"},
            { signal: "SDA", pin: "24", name: "i2c0a_sda_p0_13"}
        ],
        config: [
            { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
                value: x => convertToUnitsMacro(x, "FREQ", 1000)}
        ]},
        { zephyr: "i2c1", datamodel: "I2C1", enable: "I2C1_ENABLE",
        pins: [
            { signal: "SCL", pin: "11", name: "i2c1a_scl_p0_6"},
            { signal: "SDA", pin: "18", name: "i2c1a_sda_p0_9"}
        ],
        config: [
            { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
                value: x => convertToUnitsMacro(x, "FREQ", 1000)}
        ]},
        { zephyr: "lptimer0", datamodel: "LPTMR0", enable: "ENABLE", clock_mux: "MUX", clock_default: "AOD_CLK",
        pins: [
            { signal: "CLK", pin: "22", name: "lp_ext_clk_p0_11"},
            { signal: "IA", pin: "23", name: "lptmr0c_ia_p0_12"},
            { signal: "OAN", pin: "23", name: "lptmr0e_oan_p0_12"},
            { signal: "OA", pin: "24", name: "lptmr0c_oa_p0_13"}
        ],
        subnode: () => getAssignedPeripheral("LPTMR0").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
        subnode_boilerplate: () => getAssignedPeripheral("LPTMR0").Config?.MODE_A === "PWM" ? ['compatible = "adi,max32-pwm"', '#pwm-cells = <3>'] : [],
        pins_node: () => getAssignedPeripheral("LPTMR0").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
        config: [
            { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
        ]},
        { zephyr: "rtc_counter", datamodel: "RTC"},
        { zephyr: "spi0", datamodel: "SPI0", enable: "SPI0_ENABLE",
        pins: [
            { signal: "CS0", pin: "10", name: "spi0a_ts0_p0_5"},
            { signal: "MISO", pin: "5", name: "spi0a_cito_p0_2"},
            { signal: "MOSI", pin: "6", name: "spi0a_copi_p0_3"},
            { signal: "SCK", pin: "7", name: "spi0a_sck_p0_4"}
        ],
        config: [
            { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "15000000",
                value: x => convertToUnitsMacro(x, "FREQ", 1000)}
        ]},
        { zephyr: "spi1", datamodel: "SPI1", enable: "SPI1_ENABLE",
        pins: [
            { signal: "MISO", pin: "14", name: "spi1a_miso_p0_7"},
            { signal: "MOSI", pin: "15", name: "spi1a_mosi_p0_8"},
            { signal: "SCK", pin: "16", name: "spi1a_sck_p0_17"},
            { signal: "CS0", pin: "17", name: "spi1a_ss0_p0_18"},
            { signal: "CS0", pin: "21", name: "spi1b_ts0_p0_10"},
            { signal: "SCK", pin: "22", name: "spi1b_sck_p0_11"},
            { signal: "MOSI", pin: "23", name: "spi1b_coti_p0_12"},
            { signal: "MISO", pin: "24", name: "spi1b_cito_p0_13"}
        ],
        config: [
            { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "15000000",
                value: x => convertToUnitsMacro(x, "FREQ", 1000)}
        ]},
        { zephyr: "timer0", datamodel: "TMR0", enable: "TMR0_ENABLE", clock_mux: "TMR0a_MUX", clock_default: "PCLK",
        pins: [
            { signal: "OA", pin: "3", name: "tmr0c_oa_p0_0"},
            { signal: "IA", pin: "4", name: "tmr0c_ia_p0_1"},
            { signal: "IA", pin: "5", name: "tmr0c_ia_p0_2"},
            { signal: "OA", pin: "6", name: "tmr0c_oa_p0_3"},
            { signal: "IA", pin: "8", name: "tmr0d_ia_p0_15"},
            { signal: "OA", pin: "9", name: "tmr0d_oa_p0_16"}
        ],
        subnode: () => getAssignedPeripheral("TMR0").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
        pins_node: () => getAssignedPeripheral("TMR0").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
        config: [
            { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
        ]},
        { zephyr: "timer1", datamodel: "TMR1", enable: "TMR1_ENABLE", clock_mux: "TMR1a_MUX", clock_default: "PCLK",
        pins: [
            { signal: "OA", pin: "10", name: "tmr1c_oa_p0_5"},
            { signal: "IA", pin: "19", name: "tmrt1c_ia_p0_19"},
            { signal: "OA", pin: "20", name: "tmrt1c_oa_p0_20"},
            { signal: "OA", pin: "3", name: "tmr1d_oa_p0_0"},
            { signal: "IA", pin: "4", name: "tmr1d_ia_p0_1"},
            { signal: "IA", pin: "7", name: "tmr1c_ia_p0_4"}
        ],
        subnode: () => getAssignedPeripheral("TMR1").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
        pins_node: () => getAssignedPeripheral("TMR1").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
        config: [
            { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
        ]},
        { zephyr: "timer2", datamodel: "TMR2", enable: "TMR2_ENABLE", clock_mux: "TMR2a_MUX", clock_default: "PCLK",
        pins: [
            { signal: "IA", pin: "11", name: "tmr2c_ia_p0_6"},
            { signal: "IA", pin: "14", name: "tmr2c_ia_p0_7"},
            { signal: "OA", pin: "15", name: "tmr2c_oa_p0_8"},
            { signal: "OA", pin: "18", name: "tmr2c_oa_p0_9"},
            { signal: "IA", pin: "8", name: "tmr2c_ia_p0_15"},
            { signal: "OA", pin: "9", name: "tmr2c_oa_p0_16"}
        ],
        subnode: () => getAssignedPeripheral("TMR2").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
        pins_node: () => getAssignedPeripheral("TMR2").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
        config: [
            { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
        ]},
        { zephyr: "trng", datamodel: "TRNG", enable: "TRNG_ENABLE"},
        { zephyr: "uart0", datamodel: "UART0", enable: "UART0_ENABLE", clock_mux: "UART0_MUX", clock_default: "PCLK",
        pins: [
            { signal: "RX", pin: "14", name: "uart0d_rx_p0_7"},
            { signal: "CTS", pin: "14", name: "uart0b_cts_p0_7"},
            { signal: "RTS", pin: "15", name: "uart0b_rts_p0_8"},
            { signal: "TX", pin: "15", name: "uart0d_tx_p0_8"},
            { signal: "CTS", pin: "16", name: "uart0d_cts_p0_17"},
            { signal: "RTS", pin: "19", name: "uart0a_rts_p0_19"},
            { signal: "CTS", pin: "20", name: "uart0a_cts_p0_20"},
            { signal: "TX", pin: "21", name: "uart0a_tx_p0_10"},
            { signal: "RX", pin: "22", name: "uart0a_rx_p0_11"}
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
            { signal: "RTS", pin: "10", name: "uart1b_rts_p0_5"},
            { signal: "TX", pin: "5", name: "uart1b_tx_p0_2"},
            { signal: "RX", pin: "6", name: "uart1b_rx_p0_3"},
            { signal: "CTS", pin: "7", name: "uart1b_cts_p0_4"}
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
        { zephyr: "wdt0", datamodel: "WDT0", enable: "ENABLE", clock_mux: "MUX", clock_default: "PCLK"}
    ];
} else if (it.cfsconfig.Package.toUpperCase() === "WLP") {
    peripheralData = [
        { zephyr: "adc", datamodel: "ADC", enable: "ENABLE", clock_mux: "MUX", clock_default: "SYS_OSC",
        pins: [
            { signal: "AIN0", pin: "C2", name: "ain0_p0_13"},
            { signal: "TRIG_E", pin: "C3", name: "adc_trig_e_p0_0"},
            { signal: "AIN1", pin: "D2", name: "ain1_p0_12"},
            { signal: "AIN2", pin: "D3", name: "ain2_p0_11"},
            { signal: "AIN3", pin: "D4", name: "ain3_p0_10"},
            { signal: "TRIG_D", pin: "D5", name: "adc_trig_d_p0_9"}
        ],
        config: [
            { name: "clock-divider", type: "int", clocknode: "ADC", control: "DIV", cfg_default: "16"},
            { name: "track-count", type: "int", control: "TRACK_CNT", cfg_default: "0"},
            { name: "idle-count", type: "int", control: "IDLE_CNT", cfg_default: "0"}
        ]},
        { zephyr: "can0", datamodel: "CAN", enable: "ENABLE",
        pins: [
            { signal: "RX", pin: "C4", name: "can0b_rx_p0_6"},
            { signal: "TX", pin: "D5", name: "can0b_tx_p0_9"}
      ]},
        { zephyr: "dma0", datamodel: "DMA", enable: "ENABLE"},
        { zephyr: "flc0", datamodel: "FLC"},
        { zephyr: "i2c0", datamodel: "I2C0", enable: "I2C0_ENABLE",
        pins: [
            { signal: "SDA", pin: "C2", name: "i2c0a_sda_p0_13"},
            { signal: "SCL", pin: "D2", name: "i2c0a_scl_p0_12"}
        ],
        config: [
            { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
                value: x => convertToUnitsMacro(x, "FREQ", 1000)}
        ]},
        { zephyr: "i2c1", datamodel: "I2C1", enable: "I2C1_ENABLE",
        pins: [
            { signal: "SCL", pin: "C4", name: "i2c1a_scl_p0_6"},
            { signal: "SDA", pin: "D5", name: "i2c1a_sda_p0_9"}
        ],
        config: [
            { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
                value: x => convertToUnitsMacro(x, "FREQ", 1000)}
        ]},
        { zephyr: "lptimer0", datamodel: "LPTMR0", enable: "ENABLE", clock_mux: "MUX", clock_default: "AOD_CLK",
        pins: [
            { signal: "OA", pin: "C2", name: "lptmr0c_oa_p0_13"},
            { signal: "IA", pin: "D2", name: "lptmr0c_ia_p0_12"},
            { signal: "OAN", pin: "D2", name: "lptmr0e_oan_p0_12"},
            { signal: "CLK", pin: "D3", name: "lp_ext_clk_p0_11"}
        ],
        subnode: () => getAssignedPeripheral("LPTMR0").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
        subnode_boilerplate: () => getAssignedPeripheral("LPTMR0").Config?.MODE_A === "PWM" ? ['compatible = "adi,max32-pwm"', '#pwm-cells = <3>'] : [],
        pins_node: () => getAssignedPeripheral("LPTMR0").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
        config: [
            { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
        ]},
        { zephyr: "rtc_counter", datamodel: "RTC"},
        { zephyr: "spi0", datamodel: "SPI0", enable: "SPI0_ENABLE",
        pins: [
            { signal: "MOSI", pin: "A4", name: "spi0a_copi_p0_3"},
            { signal: "SCK", pin: "A5", name: "spi0a_sck_p0_4"},
            { signal: "MISO", pin: "B3", name: "spi0a_cito_p0_2"},
            { signal: "CS0", pin: "B4", name: "spi0a_ts0_p0_5"}
        ],
        config: [
            { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "15000000",
                value: x => convertToUnitsMacro(x, "FREQ", 1000)}
        ]},
        { zephyr: "spi1", datamodel: "SPI1", enable: "SPI1_ENABLE",
        pins: [
            { signal: "MISO", pin: "C2", name: "spi1b_cito_p0_13"},
            { signal: "MOSI", pin: "D2", name: "spi1b_coti_p0_12"},
            { signal: "SCK", pin: "D3", name: "spi1b_sck_p0_11"},
            { signal: "CS0", pin: "D4", name: "spi1b_ts0_p0_10"}
        ],
        config: [
            { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "15000000",
                value: x => convertToUnitsMacro(x, "FREQ", 1000)}
        ]},
        { zephyr: "timer0", datamodel: "TMR0", enable: "TMR0_ENABLE", clock_mux: "TMR0a_MUX", clock_default: "PCLK",
        pins: [
            { signal: "IA", pin: "A3", name: "tmr0c_ia_p0_1"},
            { signal: "OA", pin: "A4", name: "tmr0c_oa_p0_3"},
            { signal: "IA", pin: "B3", name: "tmr0c_ia_p0_2"},
            { signal: "OA", pin: "C3", name: "tmr0c_oa_p0_0"}
        ],
        subnode: () => getAssignedPeripheral("TMR0").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
        pins_node: () => getAssignedPeripheral("TMR0").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
        config: [
            { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
        ]},
        { zephyr: "timer1", datamodel: "TMR1", enable: "TMR1_ENABLE", clock_mux: "TMR1a_MUX", clock_default: "PCLK",
        pins: [
            { signal: "IA", pin: "A3", name: "tmr1d_ia_p0_1"},
            { signal: "IA", pin: "A5", name: "tmr1c_ia_p0_4"},
            { signal: "OA", pin: "B4", name: "tmr1c_oa_p0_5"},
            { signal: "OA", pin: "C3", name: "tmr1d_oa_p0_0"}
        ],
        subnode: () => getAssignedPeripheral("TMR1").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
        pins_node: () => getAssignedPeripheral("TMR1").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
        config: [
            { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
        ]},
        { zephyr: "timer2", datamodel: "TMR2", enable: "TMR2_ENABLE", clock_mux: "TMR2a_MUX", clock_default: "PCLK",
        pins: [
            { signal: "IA", pin: "C4", name: "tmr2c_ia_p0_6"},
            { signal: "OA", pin: "D5", name: "tmr2c_oa_p0_9"}
        ],
        subnode: () => getAssignedPeripheral("TMR2").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
        pins_node: () => getAssignedPeripheral("TMR2").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
        config: [
            { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
        ]},
        { zephyr: "trng", datamodel: "TRNG", enable: "TRNG_ENABLE"},
        { zephyr: "uart0", datamodel: "UART0", enable: "UART0_ENABLE", clock_mux: "UART0_MUX", clock_default: "PCLK",
        pins: [
            { signal: "RX", pin: "D3", name: "uart0a_rx_p0_11"},
            { signal: "TX", pin: "D4", name: "uart0a_tx_p0_10"}
        ],
        config: [
            { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200"},
            { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
                value: x => (x === "DISABLED" ? "none" : x.toLowerCase()) },
            { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
                value: x => (x === "1" ? "1" : (getAssignedPeripheral("UART0").Config?.CHAR_SIZE === "5" ? "1_5" : "2"))},
            { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5"}
        ]},
        { zephyr: "uart1", datamodel: "UART1", enable: "UART1_ENABLE", clock_mux: "UART1_MUX", clock_default: "PCLK",
        pins: [
            { signal: "RX", pin: "A4", name: "uart1b_rx_p0_3"},
            { signal: "CTS", pin: "A5", name: "uart1b_cts_p0_4"},
            { signal: "TX", pin: "B3", name: "uart1b_tx_p0_2"},
            { signal: "RTS", pin: "B4", name: "uart1b_rts_p0_5"}
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
        { zephyr: "wdt0", datamodel: "WDT0", enable: "ENABLE", clock_mux: "MUX", clock_default: "PCLK"}
    ];
}

unsupported_in_dts = [
    {datamodel: "AES", diag: "The Advanced Encryption Standard and True Random Number Generator peripheral is not currently supported in devicetree.", ctrl: "AES_ENABLE", value: "TRUE"},
    {datamodel: "AES KEY", diag: "The Advanced Encryption Standard and True Random Number Generator peripheral is not currently supported in devicetree.", ctrl: "AES_KEY_ENABLE", value: "TRUE"},
    {datamodel: "TRNG", diag: "The Advanced Encryption Standard and True Random Number Generator peripheral is not currently supported in devicetree.", ctrl: "TRNG_ENABLE", value: "TRUE"},
    {clocknode: "AOD_CLK", diag: "Setting divide value on AOD from the GCR is not currently supported in devicetree.", ctrl: "DIV", value: "8" },
    {clocknode: "AOD_CLK", diag: "Setting divide value on AOD from the GCR is not currently supported in devicetree.", ctrl: "DIV", value: "16" },
    {clocknode: "AOD_CLK", diag: "Setting divide value on AOD from the GCR is not currently supported in devicetree.", ctrl: "DIV", value: "32" },
    {clocknode: "ERFO Mux", diag: "Bypass of the ERFO is not currently supported in devicetree.", ctrl: "MUX", value: "ERFO_CLK" },
    {clocknode: "ERTCO Mux", diag: "Bypass of the ERTCO is not currently supported in devicetree.", ctrl: "MUX", value: "ERTCO_CLK" },
    {datamodel: "I2S", diag: "The Inter-IC Sound Interface peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "ICC", diag: "The Instruction Cache Controler is not currently supported in devicetree."},
    {datamodel: "IPO PRESCALER", diag: "Setting divide value on IPO PRESCALER from the GCR is not currently supported in devicetree.", ctrl: "DIV", value: "2"},
    {datamodel: "IPO PRESCALER", diag: "Setting divide value on IPO PRESCALER from the GCR is not currently supported in devicetree.", ctrl: "DIV", value: "4"},
    {datamodel: "IPO PRESCALER", diag: "Setting divide value on IPO PRESCALER from the GCR is not currently supported in devicetree.", ctrl: "DIV", value: "8"},
    {datamodel: "LPCMP", diag: "The LPCMP peripheral is not currently supported in devicetree."},
    {datamodel: "PT0", diag: "The Pulse Train Engines peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "PT1", diag: "The Pulse Train Engines peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "PT2", diag: "The Pulse Train Engines peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "PT3", diag: "The Pulse Train Engines peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "PTG", diag: "The PTG peripheral is not currently supported in devicetree."},
    {datamodel: "RTC", clocknode: "32KCAL", diag: "Enabling 32KCAL from the RTC is not currently supported in devicetree.", ctrl: "32KCAL", value: "1HZ"},
    {datamodel: "RTC", clocknode: "32KCAL", diag: "Enabling 32KCAL from the RTC is not currently supported in devicetree.", ctrl: "32KCAL", value: "512HZ"},
    {datamodel: "RTC", clocknode: "32KCAL", diag: "Enabling 32KCAL from the RTC is not currently supported in devicetree.", ctrl: "32KCAL", value: "4KHZ"},
    {datamodel: "RTC", clocknode: "32KCAL", diag: "Enabling 32KCAL from the RTC is not currently supported in devicetree.", ctrl: "32KCAL", value: "32KHZ"}
];

function mapClockName(clock) {
    if (clock === "HF_EXT_CLK") {
        return "extclk";
    } else if (clock === "IPO PRESCALER") {
        return "ipo";
    } else if (clock === "PCLK") {
        return undefined;
    } else if (clock === "SYS_CLK") {
        return undefined;
    } else if (clock === "SYS_OSC") {
        return undefined;
    } else if (clock === "LP_EXT_CLK" || clock === "AOD_CLK") {
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
