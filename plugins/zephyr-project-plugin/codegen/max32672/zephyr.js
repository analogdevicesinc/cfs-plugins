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

if (it.cfsconfig.Package.toUpperCase() === "TQFN40") {

  peripheralData = [
    { zephyr: "adc", datamodel: "ADC", enable: "ENABLE", clock_mux: "MUX", clock_default: "SYS_OSC",
      pins: [
          { signal: "TRIG_D", pin: "18", name: "adc_trig_d_p0_29"},
          { signal: "AIN0", pin: "19", name: "ain0_p0_8"},
          { signal: "AIN1", pin: "20", name: "ain_c0_n_p0_9"},
          { signal: "AIN2", pin: "21", name: "ain_c0_n_p0_10"},
          { signal: "AIN3", pin: "22", name: "ain_c0_n_p0_11"},
          { signal: "AIN4", pin: "23", name: "ain_c0_p_p0_12"},
          { signal: "AIN5", pin: "24", name: "ain_c0_p_p0_13"},
          { signal: "AIN6", pin: "25", name: "ain_c0_p_p0_14"},
          { signal: "AIN7", pin: "26", name: "ain_c0_p_p0_15"},
          { signal: "AIN8", pin: "27", name: "ain8_p0_16"},
          { signal: "AIN9", pin: "28", name: "ain9_p0_17"},
          { signal: "AIN10", pin: "29", name: "ain10_p0_18"},
          { signal: "TRIG_B", pin: "3", name: "adc_trig_b_p0_22"},
          { signal: "AIN11", pin: "30", name: "ain11_p0_19"}
      ],
      config: [
          { name: "clock-divider", type: "int", clocknode: "ADC", control: "DIV", cfg_default: "16"},
          { name: "track-count", type: "int", control: "TRACK_CNT", cfg_default: "0"},
          { name: "idle-count", type: "int", control: "IDLE_CNT", cfg_default: "0"}
      ]},
    { zephyr: "dma0", datamodel: "DMA", enable: "ENABLE"},
    { zephyr: "flc0", datamodel: "FLC0"},
    { zephyr: "flc1", datamodel: "FLC1"},
    { zephyr: "i2c0", datamodel: "I2C0", enable: "I2C0_ENABLE",
      pins: [
          { signal: "SCL", pin: "10", name: "i2c0a_scl_p0_6"},
          { signal: "SDA", pin: "11", name: "i2c0a_sda_p0_7"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { zephyr: "i2c1", datamodel: "I2C1", enable: "I2C1_ENABLE",
      pins: [
          { signal: "SCL", pin: "23", name: "i2c1a_scl_p0_12"},
          { signal: "SDA", pin: "24", name: "i2c1a_sda_p0_13"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { zephyr: "i2c2", datamodel: "I2C2", enable: "I2C2_ENABLE",
      pins: [
          { signal: "SCL", pin: "29", name: "i2c2a_scl_p0_18"},
          { signal: "SDA", pin: "30", name: "i2c2a_sda_p0_19"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { zephyr: "lptimer0", datamodel: "LPTMR0", enable: "ENABLE", clock_mux: "MUX", clock_default: "ERTCO",
      pins: [
          { signal: "IA", pin: "10", name: "lptmr0b_ia_p0_6"},
          { signal: "OA", pin: "11", name: "lptmr0b_oa_p0_7"}
      ],
      subnode: () => getAssignedPeripheral("LPTMR0").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      subnode_boilerplate: () => getAssignedPeripheral("LPTMR0").Config?.MODE_A === "PWM" ? ['compatible = "adi,max32-pwm"', '#pwm-cells = <3>'] : [],
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
      subnode_boilerplate: () => getAssignedPeripheral("LPTMR1").Config?.MODE_A === "PWM" ? ['compatible = "adi,max32-pwm"', '#pwm-cells = <3>'] : [],
      pins_node: () => getAssignedPeripheral("LPTMR1").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { zephyr: "uart3", datamodel: "LPUART0", enable: "ENABLE", clock_mux: "MUX", clock_default: "ERTCO",
      pins: [
          { signal: "CTS", pin: "13", name: "lpuart0a_cts_p0_24"},
          { signal: "RTS", pin: "14", name: "lpuart0a_rts_p0_25"},
          { signal: "RX", pin: "15", name: "lpuart0a_rx_p0_26"},
          { signal: "TX", pin: "16", name: "lpuart0a_tx_p0_27"}
      ],
      config: [
          { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200"},
          { name: "hw-flow-control", type: "boolean", control: "HW_FLOW_CTRL", cfg_default: "DISABLED",
            value: x => x !== "DISABLED"},
          { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
            value: x => (x === "DISABLED" ? "none" : x.toLowerCase()) },
          { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
            value: x => (x === "1" ? "1" : (getAssignedPeripheral("LPUART0").Config?.CHAR_SIZE === "5" ? "1_5" : "2"))},
          { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5"}
      ]},
    { zephyr: "rtc_counter", datamodel: "RTC"},
    { zephyr: "spi0", datamodel: "SPI0", enable: "SPI0_ENABLE",
      pins: [
          { signal: "CS1", pin: "10", name: "spi0c_ss1_p0_6"},
          { signal: "CS2", pin: "11", name: "spi0c_ss2_p0_7"},
          { signal: "CS3", pin: "12", name: "spi0c_ss3_p0_23"},
          { signal: "MISO", pin: "6", name: "spi0a_miso_p0_2"},
          { signal: "MOSI", pin: "7", name: "spi0a_mosi_p0_3"},
          { signal: "SCK", pin: "8", name: "spi0a_sck_p0_4"},
          { signal: "CS0", pin: "9", name: "spi0a_ss0_p0_5"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "15000000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { zephyr: "spi1", datamodel: "SPI1", enable: "SPI1_ENABLE",
      pins: [
          { signal: "CS0", pin: "18", name: "spi1_ss0_p0_29"},
          { signal: "MISO", pin: "25", name: "spi1a_miso_p0_14"},
          { signal: "MOSI", pin: "26", name: "spi1a_mosi_p0_15"},
          { signal: "SCK", pin: "27", name: "spi1a_sck_p0_16"},
          { signal: "CS0", pin: "28", name: "spi1a_ss0_p0_17"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "15000000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { zephyr: "timer0", datamodel: "TMR0", enable: "TMR0_ENABLE", clock_mux: "TMR0a_MUX", clock_default: "PCLK",
      pins: [
          { signal: "IA", pin: "19", name: "tmr0c_ia_p0_8"},
          { signal: "OA", pin: "20", name: "tmr0c_oa_p0_9"},
          { signal: "IA", pin: "27", name: "tmr0c_ia_p0_16"},
          { signal: "OA", pin: "28", name: "tmr0c_oa_p0_17"},
          { signal: "IA", pin: "3", name: "tmr0c_ia_p0_22"},
          { signal: "IA", pin: "4", name: "tmr0c_ia_p0_0"},
          { signal: "OA", pin: "5", name: "tmr0c_oa_p0_1"}
      ],
      subnode: () => getAssignedPeripheral("TMR0").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR0").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { zephyr: "timer1", datamodel: "TMR1", enable: "TMR1_ENABLE", clock_mux: "TMR1a_MUX", clock_default: "PCLK",
      pins: [
          { signal: "IA", pin: "21", name: "tmr1c_ia_p0_10"},
          { signal: "OA", pin: "22", name: "tmr1c_oa_p0_11"},
          { signal: "IA", pin: "29", name: "tmr1c_ia_p0_18"},
          { signal: "OA", pin: "30", name: "tmr1c_oa_p0_19"},
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
          { signal: "IA", pin: "23", name: "tmr2c_ia_p0_12"},
          { signal: "OA", pin: "24", name: "tmr2c_oa_p0_13"},
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
          { signal: "IA", pin: "17", name: "tmr3c_ia_p0_28"},
          { signal: "OA", pin: "18", name: "tmr3c_oa_p0_29"},
          { signal: "IA", pin: "25", name: "tmr3c_ia_p0_14"},
          { signal: "OA", pin: "26", name: "tmr3c_oa_p0_15"}
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
          { signal: "RX", pin: "19", name: "uart0a_rx_p0_8"},
          { signal: "TX", pin: "20", name: "uart0a_tx_p0_9"},
          { signal: "CTS", pin: "21", name: "uart0a_cts_p0_10"},
          { signal: "RTS", pin: "22", name: "uart0a_rts_p0_11"}
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
          { signal: "RX", pin: "17", name: "uart1a_rx_p0_28"},
          { signal: "TX", pin: "18", name: "uart1a_tx_p0_29"},
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
            value: x => (x === "DISABLED" ? "none" : x.toLowerCase()) },
          { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
            value: x => (x === "1" ? "1" : (getAssignedPeripheral("UART1").Config?.CHAR_SIZE === "5" ? "1_5" : "2"))},
          { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5"}
      ]},
    { zephyr: "uart2", datamodel: "UART2", enable: "UART2_ENABLE", clock_mux: "UART2_MUX", clock_default: "PCLK",
      pins: [
          { signal: "RX", pin: "25", name: "uart2b_rx_p0_14"},
          { signal: "TX", pin: "26", name: "uart2b_tx_p0_15"},
          { signal: "CTS", pin: "27", name: "uart2b_cts_p0_16"},
          { signal: "RTS", pin: "28", name: "uart2b_rts_p0_17"}
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
    { zephyr: "wdt0", datamodel: "WDT0", enable: "WDT0_ENABLE", clock_mux: "WDT0_MUX", clock_default: "PCLK"},
    { zephyr: "wdt1", datamodel: "WDT1", enable: "WDT1_ENABLE", clock_mux: "WDT1_MUX", clock_default: "PCLK"}
  ];

} else if (it.cfsconfig.Package.toUpperCase() === "TQFN56") {

  peripheralData = [
    { zephyr: "adc", datamodel: "ADC", enable: "ENABLE", clock_mux: "MUX", clock_default: "SYS_OSC",
      pins: [
          { signal: "TRIG_D", pin: "21", name: "adc_trig_d_p1_4"},
          { signal: "TRIG_D", pin: "25", name: "adc_trig_d_p0_29"},
          { signal: "AIN0", pin: "28", name: "ain0_p0_8"},
          { signal: "AIN1", pin: "29", name: "ain_c0_n_p0_9"},
          { signal: "TRIG_B", pin: "3", name: "adc_trig_b_p0_22"},
          { signal: "AIN2", pin: "30", name: "ain_c0_n_p0_10"},
          { signal: "AIN3", pin: "31", name: "ain_c0_n_p0_11"},
          { signal: "AIN4", pin: "32", name: "ain_c0_p_p0_12"},
          { signal: "AIN5", pin: "33", name: "ain_c0_p_p0_13"},
          { signal: "AIN6", pin: "34", name: "ain_c0_p_p0_14"},
          { signal: "AIN7", pin: "35", name: "ain_c0_p_p0_15"},
          { signal: "AIN8", pin: "36", name: "ain8_p0_16"},
          { signal: "AIN9", pin: "41", name: "ain9_p0_17"},
          { signal: "AIN10", pin: "42", name: "ain10_p0_18"},
          { signal: "AIN11", pin: "43", name: "ain11_p0_19"}
      ],
      config: [
          { name: "clock-divider", type: "int", clocknode: "ADC", control: "DIV", cfg_default: "16"},
          { name: "track-count", type: "int", control: "TRACK_CNT", cfg_default: "0"},
          { name: "idle-count", type: "int", control: "IDLE_CNT", cfg_default: "0"}
      ]},
    { zephyr: "dma0", datamodel: "DMA", enable: "ENABLE"},
    { zephyr: "flc0", datamodel: "FLC0"},
    { zephyr: "flc1", datamodel: "FLC1"},
    { zephyr: "i2c0", datamodel: "I2C0", enable: "I2C0_ENABLE",
      pins: [
          { signal: "SCL", pin: "12", name: "i2c0a_scl_p0_6"},
          { signal: "SDA", pin: "13", name: "i2c0a_sda_p0_7"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { zephyr: "i2c1", datamodel: "I2C1", enable: "I2C1_ENABLE",
      pins: [
          { signal: "SCL", pin: "32", name: "i2c1a_scl_p0_12"},
          { signal: "SDA", pin: "33", name: "i2c1a_sda_p0_13"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { zephyr: "i2c2", datamodel: "I2C2", enable: "I2C2_ENABLE",
      pins: [
          { signal: "SCL", pin: "42", name: "i2c2a_scl_p0_18"},
          { signal: "SDA", pin: "43", name: "i2c2a_sda_p0_19"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { zephyr: "lptimer0", datamodel: "LPTMR0", enable: "ENABLE", clock_mux: "MUX", clock_default: "ERTCO",
      pins: [
          { signal: "IA", pin: "12", name: "lptmr0b_ia_p0_6"},
          { signal: "OA", pin: "13", name: "lptmr0b_oa_p0_7"}
      ],
      subnode: () => getAssignedPeripheral("LPTMR0").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      subnode_boilerplate: () => getAssignedPeripheral("LPTMR0").Config?.MODE_A === "PWM" ? ['compatible = "adi,max32-pwm"', '#pwm-cells = <3>'] : [],
      pins_node: () => getAssignedPeripheral("LPTMR0").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { zephyr: "lptimer1", datamodel: "LPTMR1", enable: "ENABLE", clock_mux: "MUX", clock_default: "ERTCO",
      pins: [
          { signal: "OA", pin: "15", name: "lptmr1a_oa_p0_23"},
          { signal: "IA", pin: "3", name: "lptmr1a_ia_p0_22"}
      ],
      subnode: () => getAssignedPeripheral("LPTMR1").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      subnode_boilerplate: () => getAssignedPeripheral("LPTMR1").Config?.MODE_A === "PWM" ? ['compatible = "adi,max32-pwm"', '#pwm-cells = <3>'] : [],
      pins_node: () => getAssignedPeripheral("LPTMR1").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { zephyr: "uart3", datamodel: "LPUART0", enable: "ENABLE", clock_mux: "MUX", clock_default: "ERTCO",
      pins: [
          { signal: "CTS", pin: "16", name: "lpuart0a_cts_p0_24"},
          { signal: "RTS", pin: "17", name: "lpuart0a_rts_p0_25"},
          { signal: "RX", pin: "18", name: "lpuart0a_rx_p0_26"},
          { signal: "TX", pin: "23", name: "lpuart0a_tx_p0_27"}
      ],
      config: [
          { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200"},
          { name: "hw-flow-control", type: "boolean", control: "HW_FLOW_CTRL", cfg_default: "DISABLED",
            value: x => x !== "DISABLED"},
          { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
            value: x => (x === "DISABLED" ? "none" : x.toLowerCase()) },
          { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
            value: x => (x === "1" ? "1" : (getAssignedPeripheral("LPUART0").Config?.CHAR_SIZE === "5" ? "1_5" : "2"))},
          { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5"}
      ]},
    { zephyr: "rtc_counter", datamodel: "RTC"},
    { zephyr: "spi0", datamodel: "SPI0", enable: "SPI0_ENABLE",
      pins: [
          { signal: "SCK", pin: "10", name: "spi0a_sck_p0_4"},
          { signal: "CS0", pin: "11", name: "spi0a_ss0_p0_5"},
          { signal: "CS1", pin: "12", name: "spi0c_ss1_p0_6"},
          { signal: "CS2", pin: "13", name: "spi0c_ss2_p0_7"},
          { signal: "CS3", pin: "15", name: "spi0c_ss3_p0_23"},
          { signal: "MISO", pin: "8", name: "spi0a_miso_p0_2"},
          { signal: "MOSI", pin: "9", name: "spi0a_mosi_p0_3"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "15000000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { zephyr: "spi1", datamodel: "SPI1", enable: "SPI1_ENABLE",
      pins: [
          { signal: "CS0", pin: "25", name: "spi1_ss0_p0_29"},
          { signal: "MISO", pin: "34", name: "spi1a_miso_p0_14"},
          { signal: "MOSI", pin: "35", name: "spi1a_mosi_p0_15"},
          { signal: "SCK", pin: "36", name: "spi1a_sck_p0_16"},
          { signal: "CS0", pin: "41", name: "spi1a_ss0_p0_17"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "15000000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { zephyr: "spi2", datamodel: "SPI2", enable: "SPI2_ENABLE",
      pins: [
          { signal: "MOSI", pin: "19", name: "spi2a_mosi_p1_2"},
          { signal: "MISO", pin: "20", name: "spi2a_miso_p1_1"},
          { signal: "CS0", pin: "21", name: "spi2a_ss0_p1_4"},
          { signal: "SCK", pin: "22", name: "spi2a_sck_p1_3"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "15000000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { zephyr: "timer0", datamodel: "TMR0", enable: "TMR0_ENABLE", clock_mux: "TMR0a_MUX", clock_default: "PCLK",
      pins: [
          { signal: "OA", pin: "21", name: "tmr0c_oa_p1_4"},
          { signal: "IA", pin: "28", name: "tmr0c_ia_p0_8"},
          { signal: "OA", pin: "29", name: "tmr0c_oa_p0_9"},
          { signal: "IA", pin: "3", name: "tmr0c_ia_p0_22"},
          { signal: "IA", pin: "36", name: "tmr0c_ia_p0_16"},
          { signal: "OA", pin: "41", name: "tmr0c_oa_p0_17"},
          { signal: "IA", pin: "6", name: "tmr0c_ia_p0_0"},
          { signal: "OA", pin: "7", name: "tmr0c_oa_p0_1"}
      ],
      subnode: () => getAssignedPeripheral("TMR0").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR0").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { zephyr: "timer1", datamodel: "TMR1", enable: "TMR1_ENABLE", clock_mux: "TMR1a_MUX", clock_default: "PCLK",
      pins: [
          { signal: "IA", pin: "30", name: "tmr1c_ia_p0_10"},
          { signal: "OA", pin: "31", name: "tmr1c_oa_p0_11"},
          { signal: "IA", pin: "4", name: "tmr1c_ia_p1_0"},
          { signal: "IA", pin: "42", name: "tmr1c_ia_p0_18"},
          { signal: "OA", pin: "43", name: "tmr1c_oa_p0_19"},
          { signal: "OA", pin: "5", name: "tmr1c_oa_p1_9"},
          { signal: "IA", pin: "8", name: "tmr1c_ia_p0_2"},
          { signal: "OA", pin: "9", name: "tmr1c_oa_p0_3"}
      ],
      subnode: () => getAssignedPeripheral("TMR1").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR1").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { zephyr: "timer2", datamodel: "TMR2", enable: "TMR2_ENABLE", clock_mux: "TMR2a_MUX", clock_default: "PCLK",
      pins: [
          { signal: "IA", pin: "1", name: "tmr2c_ia_p0_20"},
          { signal: "IA", pin: "10", name: "tmr2c_ia_p0_4"},
          { signal: "OA", pin: "11", name: "tmr2c_oa_p0_5"},
          { signal: "OA", pin: "2", name: "tmr2c_oa_p0_21"},
          { signal: "IA", pin: "32", name: "tmr2c_ia_p0_12"},
          { signal: "OA", pin: "33", name: "tmr2c_oa_p0_13"}
      ],
      subnode: () => getAssignedPeripheral("TMR2").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR2").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { zephyr: "timer3", datamodel: "TMR3", enable: "TMR3_ENABLE", clock_mux: "TMR3a_MUX", clock_default: "PCLK",
      pins: [
          { signal: "IA", pin: "19", name: "tmr3c_ia_p1_2"},
          { signal: "OA", pin: "20", name: "tmr3c_oa_p1_1"},
          { signal: "IA", pin: "24", name: "tmr3c_ia_p0_28"},
          { signal: "OA", pin: "25", name: "tmr3c_oa_p0_29"},
          { signal: "IA", pin: "26", name: "tmr3c_ia_p0_30"},
          { signal: "IA", pin: "34", name: "tmr3c_ia_p0_14"},
          { signal: "OA", pin: "35", name: "tmr3c_oa_p0_15"},
          { signal: "OA", pin: "44", name: "tmr3c_oa_p0_31"}
      ],
      subnode: () => getAssignedPeripheral("TMR3").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR3").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { zephyr: "trng", datamodel: "TRNG", enable: "TRNG_ENABLE"},
    { zephyr: "uart0", datamodel: "UART0", enable: "UART0_ENABLE", clock_mux: "UART0_MUX", clock_default: "PCLK",
      pins: [
          { signal: "RX", pin: "16", name: "uart0b_rx_p0_24"},
          { signal: "TX", pin: "17", name: "uart0b_tx_p0_25"},
          { signal: "CTS", pin: "18", name: "uart0b_cts_p0_26"},
          { signal: "TX", pin: "19", name: "uart0b_tx_p1_2"},
          { signal: "RX", pin: "20", name: "uart0b_rx_p1_1"},
          { signal: "RTS", pin: "21", name: "uart0b_rts_p1_4"},
          { signal: "CTS", pin: "22", name: "uart0b_cts_p1_3"},
          { signal: "RTS", pin: "23", name: "uart0b_rts_p0_27"},
          { signal: "RX", pin: "28", name: "uart0a_rx_p0_8"},
          { signal: "TX", pin: "29", name: "uart0a_tx_p0_9"},
          { signal: "CTS", pin: "30", name: "uart0a_cts_p0_10"},
          { signal: "RTS", pin: "31", name: "uart0a_rts_p0_11"}
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
          { signal: "CTS", pin: "10", name: "uart1b_cts_p0_4"},
          { signal: "RTS", pin: "11", name: "uart1b_rts_p0_5"},
          { signal: "RX", pin: "24", name: "uart1a_rx_p0_28"},
          { signal: "TX", pin: "25", name: "uart1a_tx_p0_29"},
          { signal: "CTS", pin: "26", name: "uart1a_cts_p0_30"},
          { signal: "RTS", pin: "44", name: "uart1a_rts_p0_31"},
          { signal: "RX", pin: "8", name: "uart1b_rx_p0_2"},
          { signal: "TX", pin: "9", name: "uart1b_tx_p0_3"}
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
          { signal: "RX", pin: "34", name: "uart2b_rx_p0_14"},
          { signal: "TX", pin: "35", name: "uart2b_tx_p0_15"},
          { signal: "CTS", pin: "36", name: "uart2b_cts_p0_16"},
          { signal: "RX", pin: "37", name: "uart2a_rx_p1_5"},
          { signal: "TX", pin: "38", name: "uart2a_tx_p1_6"},
          { signal: "CTS", pin: "39", name: "uart2a_cts_p1_7"},
          { signal: "RTS", pin: "40", name: "uart2a_rts_p1_8"},
          { signal: "RTS", pin: "41", name: "uart2b_rts_p0_17"}
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
    { zephyr: "wdt0", datamodel: "WDT0", enable: "WDT0_ENABLE", clock_mux: "WDT0_MUX", clock_default: "PCLK"},
    { zephyr: "wdt1", datamodel: "WDT1", enable: "WDT1_ENABLE", clock_mux: "WDT1_MUX", clock_default: "PCLK"}
  ];

} else if (it.cfsconfig.Package.toUpperCase() === "EWLB") {

  peripheralData = [
    { zephyr: "adc", datamodel: "ADC", enable: "ENABLE", clock_mux: "MUX", clock_default: "SYS_OSC",
      pins: [
          { signal: "TRIG_D", pin: "B5", name: "adc_trig_d_p1_4"},
          { signal: "AIN0", pin: "B7", name: "ain0_p0_8"},
          { signal: "AIN2", pin: "B8", name: "ain_c0_n_p0_10"},
          { signal: "TRIG_D", pin: "C5", name: "adc_trig_d_p0_29"},
          { signal: "AIN1", pin: "C7", name: "ain_c0_n_p0_9"},
          { signal: "AIN3", pin: "C8", name: "ain_c0_n_p0_11"},
          { signal: "AIN10", pin: "D4", name: "ain10_p0_18"},
          { signal: "AIN7", pin: "D5", name: "ain_c0_p_p0_15"},
          { signal: "AIN6", pin: "D6", name: "ain_c0_p_p0_14"},
          { signal: "AIN4", pin: "D7", name: "ain_c0_p_p0_12"},
          { signal: "AIN5", pin: "D8", name: "ain_c0_p_p0_13"},
          { signal: "TRIG_B", pin: "E3", name: "adc_trig_b_p0_22"},
          { signal: "AIN11", pin: "E4", name: "ain11_p0_19"},
          { signal: "AIN9", pin: "E5", name: "ain9_p0_17"},
          { signal: "AIN8", pin: "E6", name: "ain8_p0_16"}
      ],
      config: [
          { name: "clock-divider", type: "int", clocknode: "ADC", control: "DIV", cfg_default: "16"},
          { name: "track-count", type: "int", control: "TRACK_CNT", cfg_default: "0"},
          { name: "idle-count", type: "int", control: "IDLE_CNT", cfg_default: "0"}
      ]},
    { zephyr: "dma0", datamodel: "DMA", enable: "ENABLE"},
    { zephyr: "flc0", datamodel: "FLC0"},
    { zephyr: "flc1", datamodel: "FLC1"},
    { zephyr: "i2c0", datamodel: "I2C0", enable: "I2C0_ENABLE",
      pins: [
          { signal: "SDA", pin: "C1", name: "i2c0a_sda_p0_7"},
          { signal: "SCL", pin: "C2", name: "i2c0a_scl_p0_6"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { zephyr: "i2c1", datamodel: "I2C1", enable: "I2C1_ENABLE",
      pins: [
          { signal: "SCL", pin: "D7", name: "i2c1a_scl_p0_12"},
          { signal: "SDA", pin: "D8", name: "i2c1a_sda_p0_13"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { zephyr: "i2c2", datamodel: "I2C2", enable: "I2C2_ENABLE",
      pins: [
          { signal: "SCL", pin: "D4", name: "i2c2a_scl_p0_18"},
          { signal: "SDA", pin: "E4", name: "i2c2a_sda_p0_19"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { zephyr: "lptimer0", datamodel: "LPTMR0", enable: "ENABLE", clock_mux: "MUX", clock_default: "ERTCO",
      pins: [
          { signal: "OA", pin: "C1", name: "lptmr0b_oa_p0_7"},
          { signal: "IA", pin: "C2", name: "lptmr0b_ia_p0_6"}
      ],
      subnode: () => getAssignedPeripheral("LPTMR0").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      subnode_boilerplate: () => getAssignedPeripheral("LPTMR0").Config?.MODE_A === "PWM" ? ['compatible = "adi,max32-pwm"', '#pwm-cells = <3>'] : [],
      pins_node: () => getAssignedPeripheral("LPTMR0").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { zephyr: "lptimer1", datamodel: "LPTMR1", enable: "ENABLE", clock_mux: "MUX", clock_default: "ERTCO",
      pins: [
          { signal: "OA", pin: "B2", name: "lptmr1a_oa_p0_23"},
          { signal: "IA", pin: "E3", name: "lptmr1a_ia_p0_22"}
      ],
      subnode: () => getAssignedPeripheral("LPTMR1").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      subnode_boilerplate: () => getAssignedPeripheral("LPTMR1").Config?.MODE_A === "PWM" ? ['compatible = "adi,max32-pwm"', '#pwm-cells = <3>'] : [],
      pins_node: () => getAssignedPeripheral("LPTMR1").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { zephyr: "uart3", datamodel: "LPUART0", enable: "ENABLE", clock_mux: "MUX", clock_default: "ERTCO",
      pins: [
          { signal: "CTS", pin: "A2", name: "lpuart0a_cts_p0_24"},
          { signal: "RX", pin: "A3", name: "lpuart0a_rx_p0_26"},
          { signal: "RTS", pin: "B3", name: "lpuart0a_rts_p0_25"},
          { signal: "TX", pin: "B6", name: "lpuart0a_tx_p0_27"}
      ],
      config: [
          { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200"},
          { name: "hw-flow-control", type: "boolean", control: "HW_FLOW_CTRL", cfg_default: "DISABLED",
            value: x => x !== "DISABLED"},
          { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
            value: x => (x === "DISABLED" ? "none" : x.toLowerCase()) },
          { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
            value: x => (x === "1" ? "1" : (getAssignedPeripheral("LPUART0").Config?.CHAR_SIZE === "5" ? "1_5" : "2"))},
          { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5"}
      ]},
    { zephyr: "rtc_counter", datamodel: "RTC"},
    { zephyr: "spi0", datamodel: "SPI0", enable: "SPI0_ENABLE",
      pins: [
          { signal: "CS3", pin: "B2", name: "spi0c_ss3_p0_23"},
          { signal: "CS2", pin: "C1", name: "spi0c_ss2_p0_7"},
          { signal: "CS1", pin: "C2", name: "spi0c_ss1_p0_6"},
          { signal: "CS0", pin: "C3", name: "spi0a_ss0_p0_5"},
          { signal: "MISO", pin: "C4", name: "spi0a_miso_p0_2"},
          { signal: "MOSI", pin: "D2", name: "spi0a_mosi_p0_3"},
          { signal: "SCK", pin: "D3", name: "spi0a_sck_p0_4"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "15000000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { zephyr: "spi1", datamodel: "SPI1", enable: "SPI1_ENABLE",
      pins: [
          { signal: "CS0", pin: "C5", name: "spi1_ss0_p0_29"},
          { signal: "MOSI", pin: "D5", name: "spi1a_mosi_p0_15"},
          { signal: "MISO", pin: "D6", name: "spi1a_miso_p0_14"},
          { signal: "CS0", pin: "E5", name: "spi1a_ss0_p0_17"},
          { signal: "SCK", pin: "E6", name: "spi1a_sck_p0_16"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "15000000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { zephyr: "spi2", datamodel: "SPI2", enable: "SPI2_ENABLE",
      pins: [
          { signal: "MISO", pin: "A4", name: "spi2a_miso_p1_1"},
          { signal: "SCK", pin: "A5", name: "spi2a_sck_p1_3"},
          { signal: "MOSI", pin: "B4", name: "spi2a_mosi_p1_2"},
          { signal: "CS0", pin: "B5", name: "spi2a_ss0_p1_4"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "15000000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { zephyr: "timer0", datamodel: "TMR0", enable: "TMR0_ENABLE", clock_mux: "TMR0a_MUX", clock_default: "PCLK",
      pins: [
          { signal: "OA", pin: "B5", name: "tmr0c_oa_p1_4"},
          { signal: "IA", pin: "B7", name: "tmr0c_ia_p0_8"},
          { signal: "OA", pin: "C7", name: "tmr0c_oa_p0_9"},
          { signal: "OA", pin: "D1", name: "tmr0c_oa_p0_1"},
          { signal: "IA", pin: "E1", name: "tmr0c_ia_p0_0"},
          { signal: "IA", pin: "E3", name: "tmr0c_ia_p0_22"},
          { signal: "OA", pin: "E5", name: "tmr0c_oa_p0_17"},
          { signal: "IA", pin: "E6", name: "tmr0c_ia_p0_16"}
      ],
      subnode: () => getAssignedPeripheral("TMR0").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR0").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { zephyr: "timer1", datamodel: "TMR1", enable: "TMR1_ENABLE", clock_mux: "TMR1a_MUX", clock_default: "PCLK",
      pins: [
          { signal: "IA", pin: "B8", name: "tmr1c_ia_p0_10"},
          { signal: "IA", pin: "C4", name: "tmr1c_ia_p0_2"},
          { signal: "OA", pin: "C8", name: "tmr1c_oa_p0_11"},
          { signal: "OA", pin: "D2", name: "tmr1c_oa_p0_3"},
          { signal: "IA", pin: "D4", name: "tmr1c_ia_p0_18"},
          { signal: "IA", pin: "E2", name: "tmr1c_ia_p1_0"},
          { signal: "OA", pin: "E4", name: "tmr1c_oa_p0_19"},
          { signal: "OA", pin: "F1", name: "tmr1c_oa_p1_9"}
      ],
      subnode: () => getAssignedPeripheral("TMR1").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR1").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { zephyr: "timer2", datamodel: "TMR2", enable: "TMR2_ENABLE", clock_mux: "TMR2a_MUX", clock_default: "PCLK",
      pins: [
          { signal: "OA", pin: "C3", name: "tmr2c_oa_p0_5"},
          { signal: "IA", pin: "D3", name: "tmr2c_ia_p0_4"},
          { signal: "IA", pin: "D7", name: "tmr2c_ia_p0_12"},
          { signal: "OA", pin: "D8", name: "tmr2c_oa_p0_13"},
          { signal: "IA", pin: "F2", name: "tmr2c_ia_p0_20"},
          { signal: "OA", pin: "G1", name: "tmr2c_oa_p0_21"}
      ],
      subnode: () => getAssignedPeripheral("TMR2").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR2").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { zephyr: "timer3", datamodel: "TMR3", enable: "TMR3_ENABLE", clock_mux: "TMR3a_MUX", clock_default: "PCLK",
      pins: [
          { signal: "OA", pin: "A4", name: "tmr3c_oa_p1_1"},
          { signal: "IA", pin: "A6", name: "tmr3c_ia_p0_28"},
          { signal: "IA", pin: "B4", name: "tmr3c_ia_p1_2"},
          { signal: "OA", pin: "C5", name: "tmr3c_oa_p0_29"},
          { signal: "IA", pin: "C6", name: "tmr3c_ia_p0_30"},
          { signal: "OA", pin: "D5", name: "tmr3c_oa_p0_15"},
          { signal: "IA", pin: "D6", name: "tmr3c_ia_p0_14"},
          { signal: "OA", pin: "F6", name: "tmr3c_oa_p0_31"}
      ],
      subnode: () => getAssignedPeripheral("TMR3").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR3").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { zephyr: "trng", datamodel: "TRNG", enable: "TRNG_ENABLE"},
    { zephyr: "uart0", datamodel: "UART0", enable: "UART0_ENABLE", clock_mux: "UART0_MUX", clock_default: "PCLK",
      pins: [
          { signal: "RX", pin: "A2", name: "uart0b_rx_p0_24"},
          { signal: "CTS", pin: "A3", name: "uart0b_cts_p0_26"},
          { signal: "RX", pin: "A4", name: "uart0b_rx_p1_1"},
          { signal: "CTS", pin: "A5", name: "uart0b_cts_p1_3"},
          { signal: "TX", pin: "B3", name: "uart0b_tx_p0_25"},
          { signal: "TX", pin: "B4", name: "uart0b_tx_p1_2"},
          { signal: "RTS", pin: "B5", name: "uart0b_rts_p1_4"},
          { signal: "RTS", pin: "B6", name: "uart0b_rts_p0_27"},
          { signal: "RX", pin: "B7", name: "uart0a_rx_p0_8"},
          { signal: "CTS", pin: "B8", name: "uart0a_cts_p0_10"},
          { signal: "TX", pin: "C7", name: "uart0a_tx_p0_9"},
          { signal: "RTS", pin: "C8", name: "uart0a_rts_p0_11"}
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
          { signal: "RX", pin: "A6", name: "uart1a_rx_p0_28"},
          { signal: "RTS", pin: "C3", name: "uart1b_rts_p0_5"},
          { signal: "RX", pin: "C4", name: "uart1b_rx_p0_2"},
          { signal: "TX", pin: "C5", name: "uart1a_tx_p0_29"},
          { signal: "CTS", pin: "C6", name: "uart1a_cts_p0_30"},
          { signal: "TX", pin: "D2", name: "uart1b_tx_p0_3"},
          { signal: "CTS", pin: "D3", name: "uart1b_cts_p0_4"},
          { signal: "RTS", pin: "F6", name: "uart1a_rts_p0_31"}
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
          { signal: "TX", pin: "D5", name: "uart2b_tx_p0_15"},
          { signal: "RX", pin: "D6", name: "uart2b_rx_p0_14"},
          { signal: "RTS", pin: "E5", name: "uart2b_rts_p0_17"},
          { signal: "CTS", pin: "E6", name: "uart2b_cts_p0_16"},
          { signal: "RX", pin: "E7", name: "uart2a_rx_p1_5"},
          { signal: "CTS", pin: "E8", name: "uart2a_cts_p1_7"},
          { signal: "TX", pin: "F7", name: "uart2a_tx_p1_6"},
          { signal: "RTS", pin: "F8", name: "uart2a_rts_p1_8"}
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
    { zephyr: "wdt0", datamodel: "WDT0", enable: "WDT0_ENABLE", clock_mux: "WDT0_MUX", clock_default: "PCLK"},
    { zephyr: "wdt1", datamodel: "WDT1", enable: "WDT1_ENABLE", clock_mux: "WDT1_MUX", clock_default: "PCLK"}
  ];

}

unsupported_in_dts = [
    {datamodel: "AES", diag: "The AES peripheral is not currently supported in devicetree.", ctrl: "AES_ENABLE", value: "TRUE"},
    {clocknode: "AoD", diag: "Setting divide value on AOD from the GCR is not currently supported in devicetree.", ctrl: "DIV", value: "4" },
    {clocknode: "AoD", diag: "Setting divide value on AOD from the GCR is not currently supported in devicetree.", ctrl: "DIV", value: "8" },
    {clocknode: "AoD", diag: "Setting divide value on AOD from the GCR is not currently supported in devicetree.", ctrl: "DIV", value: "16" },
    {clocknode: "AoD", diag: "Setting divide value on AOD from the GCR is not currently supported in devicetree.", ctrl: "DIV", value: "32" },
    {datamodel: "CTB", diag: "The Cryptographic Toolbox peripheral is not currently supported in devicetree.", ctrl: "CTB_ENABLE", value: "TRUE"},
    {clocknode: "ERFO Mux", diag: "Bypass of the ERFO is not currently supported in devicetree.", ctrl: "MUX", value: "ERFO_CLK" },
    {clocknode: "ERTCO Mux", diag: "Bypass of the ERTCO is not currently supported in devicetree.", ctrl: "MUX", value: "ERTCO_CLK" },
    {datamodel: "I2S", diag: "The Inter-IC Sound Interface peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "ICC", diag: "The Instruction Cache Controller peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "LPCMP", diag: "The Low-Power Comparator peripheral is not currently supported in devicetree."},
    {datamodel: "QDEC", diag: "The Quadrature Decoder peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "RTC", clocknode: "32KCAL", diag: "Enabling 32KCAL from the RTC is not currently supported in devicetree.", ctrl: "32KCAL", value: "1HZ" },
    {datamodel: "RTC", clocknode: "32KCAL", diag: "Enabling 32KCAL from the RTC is not currently supported in devicetree.", ctrl: "32KCAL", value: "512HZ" },
    {datamodel: "RTC", clocknode: "32KCAL", diag: "Enabling 32KCAL from the RTC is not currently supported in devicetree.", ctrl: "32KCAL", value: "4KHZ" },
    {datamodel: "RTC", clocknode: "32KCAL", diag: "Enabling 32KCAL from the RTC is not currently supported in devicetree.", ctrl: "32KCAL", value: "32KHZ" },
    {datamodel: "SYS_AESKEYS", diag: "The AESKEYS peripheral is not currently supported in devicetree."},
    {datamodel: "USR_AESKEYS", diag: "The AESKEYS peripheral is not currently supported in devicetree."}
];

function mapClockName(clock) {
    if (clock === "EXT_CLK1") {
        return "extclk1";
    } else if (clock === "EXT_CLK2") {
        return undefined;
    } else if (clock === "PRESCALED IPO") {
        return "ipo";
    } else if (clock === "AOD_CLK") {
        return undefined;
    } else if (clock === "PCLK") {
        return undefined;
    } else if (clock === "SYS_OSC") {
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
