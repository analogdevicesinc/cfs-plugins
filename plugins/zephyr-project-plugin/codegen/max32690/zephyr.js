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

if (it.cfsconfig.Package.toUpperCase() === "WLP") {

   peripheralData = [
    { zephyr : "adc", datamodel : "ADC", enable : "ENABLE", clock_mux : "MUX", clock_default : "SYS_CLK",
      pins : [
        { signal: "HW_TRIG_C", pin: "D7", name: "adc_hw_trig_c_p2_15"},
        { signal: "AIN0", pin: "E10", name: "ain0_p3_0"},
        { signal: "AIN1", pin: "E11", name: "ain1_p3_1"},
        { signal: "AIN2", pin: "E12", name: "ain2_p3_2"},
        { signal: "TRIG_B", pin: "E5", name: "adc_trig_b_p1_0"},
        { signal: "AIN3", pin: "F10", name: "ain3_p3_3"},
        { signal: "AIN6", pin: "F12", name: "ain6_p3_6"},
        { signal: "TRIG_A", pin: "F7", name: "adc_trig_a_p0_10"},
        { signal: "AIN4", pin: "G10", name: "ain4_p3_4"},
        { signal: "CLK_EXT", pin: "G7", name: "adc_clk_ext_p0_9"},
        { signal: "AIN5", pin: "H10", name: "ain5_p3_5"},
        { signal: "AIN7", pin: "J10", name: "ain7_p3_7"}
      ],
      config : [
        { name: "clock-divider", type: "int", clocknode: "ADC", control: "DIV", cfg_default: "16" },
        { name: "track-count", type: "int", control: "TRACK_CNT", cfg_default: "0" },
        { name: "idle-count", type: "int", control: "IDLE_CNT", cfg_default: "0" }
      ]
    },
    { zephyr: "can0", datamodel: "CAN0", enable: "CAN0_ENABLE",
      pins: [
          { signal: "TX", pin: "F9", name: "can0b_tx_p2_23"},
          { signal: "RX", pin: "G9", name: "can0b_rx_p2_22"},
          { signal: "TX", pin: "H7", name: "can0b_tx_p1_25"},
          { signal: "RX", pin: "J7", name: "can0b_rx_p1_24"}
      ]
    },
    { zephyr: "can1", datamodel: "CAN1", enable: "CAN1_ENABLE",
      pins: [
          { signal: "TX", pin: "G3", name: "can1b_tx_p2_25"},
          { signal: "RX", pin: "L4", name: "can1b_rx_p2_24"},
          { signal: "RX", pin: "L7", name: "can1b_rx_p1_28"},
          { signal: "TX", pin: "M7", name: "can1b_tx_p1_29"}
      ]
    },
    { zephyr : "dma0", datamodel : "DMA", enable : "ENABLE" },
    { zephyr : "i2c0", datamodel : "I2C0", enable : "I2C0_ENABLE",
      pins : [
        { name: "i2c0a_scl_p0_31", signal: "SCL", pin: "F6" },
        { name: "i2c0a_scl_p2_8", signal: "SCL", pin: "J4" },
        { name: "i2c0a_sda_p0_30", signal: "SDA", pin: "G6" },
        { name: "i2c0a_sda_p2_7", signal: "SDA", pin: "H5" }
      ],
      config : [
        { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
          value: x => convertToUnitsMacro(x, "FREQ", 1000)
	}
      ]
    },
    { zephyr : "i2c1", datamodel : "I2C1", enable : "I2C1_ENABLE",
      pins : [
        { name: "i2c1a_scl_p0_12", signal: "SCL", pin: "F3" },
        { name: "i2c1a_scl_p2_18", signal: "SCL", pin: "E3" },
        { name: "i2c1a_sda_p0_11", signal: "SDA", pin: "F2" },
        { name: "i2c1a_sda_p2_17", signal: "SDA", pin: "E2" }
      ],
      config : [
        { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
          value: x => convertToUnitsMacro(x, "FREQ", 1000)
	}
      ]
    },
    { zephyr : "i2c2", datamodel : "I2C2", enable : "I2C2_ENABLE",
      pins : [
        { name: "i2c2c_scl_p0_14", signal: "SCL", pin: "C1" },
        { name: "i2c2c_scl_p1_8", signal: "SCL", pin: "A2" },
        { name: "i2c2c_sda_p0_13", signal: "SDA", pin: "D2" },
        { name: "i2c2c_sda_p1_7", signal: "SDA", pin: "D4" }
      ],
      config : [
        { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
          value: x => convertToUnitsMacro(x, "FREQ", 1000)
	}
      ]
    },
    { zephyr: "w1", datamodel: "OWM", enable: "ENABLE",
      pins : [
          { name: "owm_io_p1_31", signal: "IO", pin: "F8" },
          { name: "owm_io_p0_8", signal: "IO", pin: "G1" },
          { name: "owm_pe_p0_7", signal: "PE", pin: "G2" },
          { name: "owm_pe_p1_30", signal: "PE", pin: "G8" }
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
    { zephyr : "spi0", datamodel : "SPI0", enable : "SPI0_ENABLE",
      pins : [
        { name: "spi0a_ss0_p0_22", signal: "CS0", pin: "K1" },
        { name: "spi0b_miso_p2_27", signal: "MISO", pin: "L2" },
        { name: "spi0b_mosi_p2_28", signal: "MOSI", pin: "L1" },
        { name: "spi0b_sck_p2_29", signal: "SCK", pin: "K3" },
        { name: "spi0b_sdio2_p2_30", signal: "SDIO2", pin: "L3" },
        { name: "spi0b_sdio3_p2_31", signal: "SDIO3", pin: "K2" },
        { name: "spi0b_ss1_p2_26", signal: "CS1", pin: "M2" }
      ],
      config : [
        { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "15000000",
          value: x => convertToUnitsMacro(x, "FREQ", 1000)
	}
      ]
    },
    { zephyr : "spi1", datamodel : "SPI1", enable : "SPI1_ENABLE",
      pins : [
        { name: "spi1a_miso_p1_28", signal: "MISO", pin: "L7" },
        { name: "spi1a_mosi_p1_29", signal: "MOSI", pin: "M7" },
        { name: "spi1a_sck_p1_26", signal: "SCK", pin: "L8" },
        { name: "spi1a_ss0_p1_23", signal: "CS0", pin: "K8" },
        { name: "spi1a_ss1_p1_25", signal: "CS1", pin: "H7" },
        { name: "spi1a_ss2_p1_24", signal: "CS2", pin: "J7" },
        { name: "spi1b_sdio2_p1_30", signal: "SDIO2", pin: "G8" },
        { name: "spi1b_sdio3_p1_31", signal: "SDIO3", pin: "F8" }
      ],
      config : [
        { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "15000000",
          value: x => convertToUnitsMacro(x, "FREQ", 1000)
	}
      ]
    },
    { zephyr : "spi2", datamodel : "SPI2", enable : "SPI2_ENABLE",
      pins : [
        { name: "spi2a_miso_p2_3", signal: "MISO", pin: "L6" },
        { name: "spi2a_mosi_p2_4", signal: "MOSI", pin: "K6" },
        { name: "spi2a_sck_p2_2", signal: "SCK", pin: "M6" },
        { name: "spi2a_ss0_p2_5", signal: "CS0", pin: "J6" },
        { name: "spi2a_ss1_p2_1", signal: "CS1", pin: "H6" },
        { name: "spi2a_ss2_p1_27", signal: "CS2", pin: "K7" },
        { name: "spi2b_sdio2_p2_6", signal: "SDIO2", pin: "K4" },
        { name: "spi2b_sdio3_p2_7", signal: "SDIO3", pin: "H5" }
      ],
      config : [
        { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "15000000",
          value: x => convertToUnitsMacro(x, "FREQ", 1000)
	}
      ]
    },
    { zephyr : "spi3", datamodel : "SPI3", enable : "SPI3_ENABLE",
      pins : [
        { name: "spi3a_miso_p0_20", signal: "MISO", pin: "C3" },
        { name: "spi3a_mosi_p0_21", signal: "MOSI", pin: "B2" },
        { name: "spi3a_sck_p0_16", signal: "SCK", pin: "B3" },
        { name: "spi3a_sdio2_p0_17", signal: "SDIO2", pin: "D3" },
        { name: "spi3a_sdio3_p0_15", signal: "SDIO3", pin: "C2" },
        { name: "spi3a_ss0_p0_19", signal: "CS0", pin: "A3" },
        { name: "spi3a_ss1_p0_13", signal: "CS1", pin: "D2" },
        { name: "spi3a_ss2_p0_14", signal: "CS2", pin: "C1" }
      ],
      config : [
        { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "15000000",
          value: x => convertToUnitsMacro(x, "FREQ", 1000)
	}
      ]
    },
    { zephyr : "spi4", datamodel : "SPI4", enable : "SPI4_ENABLE",
      pins : [
        { name: "spi4a_miso_p1_2", signal: "MISO", pin: "D5" },
        { name: "spi4a_mosi_p1_1", signal: "MOSI", pin: "C4" },
        { name: "spi4a_sck_p1_3", signal: "SCK", pin: "C5" },
        { name: "spi4a_sdio2_p1_4", signal: "SDIO2", pin: "B4" },
        { name: "spi4a_sdio3_p1_5", signal: "SDIO3", pin: "A5" },
        { name: "spi4a_ss0_p1_0", signal: "CS0", pin: "E5" },
        { name: "spi4a_ss1_p1_6", signal: "CS1", pin: "B5" },
        { name: "spi4a_ss2_p1_11", signal: "CS2", pin: "B6" }
      ],
      config : [
        { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "15000000",
          value: x => convertToUnitsMacro(x, "FREQ", 1000)
	}
      ]
    },
    { zephyr : "timer0", datamodel : "TMR0", enable : "TMR0_ENABLE", clock_mux : "TMR0a_MUX", clock_default : "PCLK",
      pins : [
        { name: "tmr0b_iob_p0_14", signal: "IOB", pin: "C1"},
        { name: "tmr0b_ioa_p0_13", signal: "IOA", pin: "D2"},
        { name: "tmr0c_iobn_p0_10", signal: "IOBN", pin: "F7"},
        { name: "tmr0c_ioan_p0_9", signal: "IOAN", pin: "G7"},
        { name: "tmr0c_ioa_p0_4", signal: "IOA", pin: "H3"}
      ],
      subnode: () => getAssignedPeripheral("TMR0").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR0").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config : [
        { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1" }
      ]
    },
    { zephyr : "timer1", datamodel : "TMR1", enable : "TMR1_ENABLE", clock_mux : "TMR1a_MUX", clock_default : "PCLK",
      pins : [
        { name: "tmr1c_ioa_p0_15", signal: "IOA", pin: "C2"},
        { name: "tmr1c_iob_p0_17", signal: "IOB", pin: "D3"},
        { name: "tmr1c_ioan_p0_11", signal: "IOAN", pin: "F2"},
        { name: "tmr1c_iobn_p0_12", signal: "IOBN", pin: "F3"},
        { name: "tmr1b_iob_p0_8", signal: "IOB", pin: "G1"},
        { name: "tmr1b_ioa_p0_7", signal: "IOA", pin: "G2"}
      ],
      subnode: () => getAssignedPeripheral("TMR1").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR1").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config : [
        { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1" }
      ]
    },
    { zephyr : "timer2", datamodel : "TMR2", enable : "TMR2_ENABLE", clock_mux : "TMR2a_MUX", clock_default : "PCLK",
      pins : [
        { name: "tmr2b_iob_p1_5", signal: "IOB", pin: "A5"},
        { name: "tmr2b_ioa_p1_4", signal: "IOA", pin: "B4"},
        { name: "tmr2c_iob_p2_21", signal: "IOB", pin: "D9"},
        { name: "tmr2c_ioa_p2_20", signal: "IOA", pin: "E9"},
        { name: "tmr2c_iob_p0_5", signal: "IOB", pin: "H2"}
      ],
      subnode: () => getAssignedPeripheral("TMR2").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR2").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config : [
        { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1" }
      ]
    },
    { zephyr : "timer3", datamodel : "TMR3", enable : "TMR3_ENABLE", clock_mux : "TMR3a_MUX", clock_default : "PCLK",
      pins : [
        { name: "tmr3a_iob_p1_14", signal: "IOB", pin: "A11"},
        { name: "tmr3a_ioa_p1_13", signal: "IOA", pin: "B7"},
        { name: "tmr3c_iob_p2_31", signal: "IOB", pin: "K2"},
        { name: "tmr3c_ioa_p2_30", signal: "IOA", pin: "L3"}
      ],
      subnode: () => getAssignedPeripheral("TMR3").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR3").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config : [
        { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1" }
      ]
    },
    { zephyr : "lptimer0", datamodel : "LPTMR0", enable : "ENABLE", clock_mux : "MUX", clock_default : "IBRO",
      pins : [
        { name: "lptmr0b_ioa_p3_4", signal: "IOA", pin: "G10"}
      ],
      subnode: () => getAssignedPeripheral("LPTMR0").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("LPTMR0").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config : [
        { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1" }
      ]
    },
    { zephyr : "lptimer1", datamodel : "LPTMR1", enable : "ENABLE", clock_mux : "MUX", clock_default : "IBRO",
      pins : [
        { name: "lptmr1b_ioa_p3_7", signal: "IOA", pin: "J10"}
      ],
      subnode: () => getAssignedPeripheral("LPTMR1").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("LPTMR1").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config : [
        { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1" }
      ]
    },
    { zephyr : "trng", datamodel : "TRNG", enable : "TRNG_ENABLE" },
    { zephyr : "uart0", datamodel : "UART0", enable : "UART0_ENABLE", clock_mux : "UART0_MUX", clock_default : "PCLK",
      pins : [
        { name: "uart0a_cts_p2_9", signal: "CTS", pin: "M5" },
        { name: "uart0a_rts_p2_10", signal: "RTS", pin: "L5" },
        { name: "uart0a_rx_p2_11", signal: "RX", pin: "K5" },
        { name: "uart0a_tx_p2_12", signal: "TX", pin: "J5" }
      ],
      config : [
        { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200" },
        { name: "hw-flow-control", type: "boolean", control: "HW_FLOW_CTRL", cfg_default: "DISABLED",
          value: x => x !== "DISABLED"
        },
        { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
          value: x => (x === "DISABLED" ? "none" : (x === "EVEN" ? "even" : "odd"))
	},
        { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
          value: x => (x === "1" ? "1" : (getAssignedPeripheral("UART0").Config?.CHAR_SIZE === "5" ? "1_5" : "2"))
        },
        { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5" }
      ]
    },
    { zephyr : "uart1", datamodel : "UART1", enable : "UART1_ENABLE", clock_mux : "UART1_MUX", clock_default : "PCLK",
      pins : [
        { name: "uart1a_cts_p2_13", signal: "CTS", pin: "E6" },
        { name: "uart1a_rts_p2_15", signal: "RTS", pin: "D7" },
        { name: "uart1a_rx_p2_14", signal: "RX", pin: "D6" },
        { name: "uart1a_tx_p2_16", signal: "TX", pin: "E7" }
      ],
      config : [
        { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200" },
        { name: "hw-flow-control", type: "boolean", control: "HW_FLOW_CTRL", cfg_default: "DISABLED",
          value: x => x !== "DISABLED"
        },
        { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
          value: x => (x === "DISABLED" ? "none" : (x === "EVEN" ? "even" : "odd"))
	},
        { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
          value: x => (x === "1" ? "1" : (getAssignedPeripheral("UART1").Config?.CHAR_SIZE === "5" ? "1_5" : "2"))
        },
        { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5" }
      ]
    },
    { zephyr : "uart2", datamodel : "UART2", enable : "UART2_ENABLE", clock_mux : "UART2_MUX", clock_default : "PCLK",
      pins : [
        { name: "uart2a_cts_p1_7", signal: "CTS", pin: "D4" },
        { name: "uart2a_rts_p1_8", signal: "RTS", pin: "A2" },
        { name: "uart2a_rx_p1_9", signal: "RX", pin: "B1" },
        { name: "uart2a_tx_p1_10", signal: "TX", pin: "E4" },
        { name: "uart2c_cts_p0_2", signal: "CTS", pin: "J3" },
        { name: "uart2c_rts_p0_3", signal: "RTS", pin: "J1" },
        { name: "uart2c_rx_p0_6", signal: "RX", pin: "H1" },
        { name: "uart2c_tx_p0_1", signal: "TX", pin: "J2" }
      ],
      config : [
        { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200" },
        { name: "hw-flow-control", type: "boolean", control: "HW_FLOW_CTRL", cfg_default: "DISABLED",
          value: x => x !== "DISABLED"
        },
        { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
          value: x => (x === "DISABLED" ? "none" : (x === "EVEN" ? "even" : "odd"))
	},
        { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
          value: x => (x === "1" ? "1" : (getAssignedPeripheral("UART2").Config?.CHAR_SIZE === "5" ? "1_5" : "2"))
        },
        { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5" }
      ]
    },
    { zephyr : "uart3", datamodel : "LPUART0", enable : "ENABLE", clock_mux : "MUX", clock_default : "IBRO",
      pins : [
        { name: "lpuart0b_cts_p3_2", signal: "CTS", pin: "E12" },
        { name: "lpuart0b_rts_p3_3", signal: "RTS", pin: "F10" },
        { name: "lpuart0b_rx_p3_0", signal: "RX", pin: "E10" },
        { name: "lpuart0b_tx_p3_1", signal: "TX", pin: "E11" }
      ],
      config : [
        { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200" },
        { name: "hw-flow-control", type: "boolean", control: "HW_FLOW_CTRL", cfg_default: "DISABLED",
          value: x => x !== "DISABLED"
        },
        { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
          value: x => (x === "DISABLED" ? "none" : (x === "EVEN" ? "even" : "odd"))
	},
        { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
          value: x => (x === "1" ? "1" : (getAssignedPeripheral("LPUART0").Config?.CHAR_SIZE === "5" ? "1_5" : "2"))
        },
        { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5" }
      ]
    },
    { zephyr: "usbhs", datamodel: "USBHS", enable: "ENABLE"},
    { zephyr : "wdt0", datamodel : "WDT0", enable : "ENABLE", clock_mux : "MUX", clock_default : "PCLK" },
    { zephyr : "wdt1", datamodel : "LPWDT0", enable : "ENABLE", clock_mux : "MUX", clock_default : "IBRO" }
  ];

} else if (it.cfsconfig.Package.toUpperCase() === "CTBGA") {

  peripheralData = [
    { zephyr : "adc", datamodel : "ADC", enable : "ENABLE", clock_mux : "MUX", clock_default : "SYS_CLK",
      pins : [
        { signal: "HW_TRIG_C", pin: "J7", name: "adc_hw_trig_c_p2_15"},
        { signal: "AIN0", pin: "H10", name: "ain0_p3_0"},
        { signal: "AIN1", pin: "H11", name: "ain1_p3_1"},
        { signal: "AIN2", pin: "H12", name: "ain2_p3_2"},
        { signal: "TRIG_B", pin: "H5", name: "adc_trig_b_p1_0"},
        { signal: "AIN3", pin: "G10", name: "ain3_p3_3"},
        { signal: "AIN6", pin: "G11", name: "ain6_p3_6"},
        { signal: "TRIG_A", pin: "G7", name: "adc_trig_a_p0_10"},
        { signal: "AIN4", pin: "F10", name: "ain4_p3_4"},
        { signal: "CLK_EXT", pin: "F7", name: "adc_clk_ext_p0_9"},
        { signal: "AIN5", pin: "E10", name: "ain5_p3_5"},
        { signal: "AIN7", pin: "D10", name: "ain7_p3_7"}
      ],
      config : [
        { name: "clock-divider", type: "int", clocknode: "ADC", control: "DIV", cfg_default: "16" },
        { name: "track-count", type: "int", control: "TRACK_CNT", cfg_default: "0" },
        { name: "idle-count", type: "int", control: "IDLE_CNT", cfg_default: "0" }
      ]
    },
    { zephyr: "can0", datamodel: "CAN0", enable: "CAN0_ENABLE",
      pins: [
          { signal: "TX", pin: "G9", name: "can0b_tx_p2_23"},
          { signal: "RX", pin: "F9", name: "can0b_rx_p2_22"},
          { signal: "TX", pin: "E7", name: "can0b_tx_p1_25"},
          { signal: "RX", pin: "D7", name: "can0b_rx_p1_24"}
      ]
    },
    { zephyr: "can1", datamodel: "CAN1", enable: "CAN1_ENABLE",
      pins: [
          { signal: "TX", pin: "F3", name: "can1b_tx_p2_25"},
          { signal: "RX", pin: "B4", name: "can1b_rx_p2_24"},
          { signal: "RX", pin: "B7", name: "can1b_rx_p1_28"},
          { signal: "TX", pin: "A7", name: "can1b_tx_p1_29"}
      ]
    },
    { zephyr : "dma0", datamodel : "DMA", enable : "ENABLE" },
    { zephyr : "i2c0", datamodel : "I2C0", enable : "I2C0_ENABLE",
      pins : [
        { name: "i2c0a_scl_p0_31", signal: "SCL", pin: "G6" },
        { name: "i2c0a_scl_p2_8", signal: "SCL", pin: "D4" },
        { name: "i2c0a_sda_p0_30", signal: "SDA", pin: "F6" },
        { name: "i2c0a_sda_p2_7", signal: "SDA", pin: "E5" }
      ],
      config : [
        { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
          value: x => convertToUnitsMacro(x, "FREQ", 1000)
	}
      ]
    },
    { zephyr : "i2c1", datamodel : "I2C1", enable : "I2C1_ENABLE",
      pins : [
        { name: "i2c1a_scl_p0_12", signal: "SCL", pin: "G3" },
        { name: "i2c1a_scl_p2_18", signal: "SCL", pin: "H3" },
        { name: "i2c1a_sda_p0_11", signal: "SDA", pin: "G2" },
        { name: "i2c1a_sda_p2_17", signal: "SDA", pin: "H2" }
      ],
      config : [
        { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
          value: x => convertToUnitsMacro(x, "FREQ", 1000)
	}
      ]
    },
    { zephyr : "i2c2", datamodel : "I2C2", enable : "I2C2_ENABLE",
      pins : [
        { name: "i2c2c_scl_p0_14", signal: "SCL", pin: "K1" },
        { name: "i2c2c_scl_p1_8", signal: "SCL", pin: "M2" },
        { name: "i2c2c_sda_p0_13", signal: "SDA", pin: "J2" },
        { name: "i2c2c_sda_p1_7", signal: "SDA", pin: "J4" }
      ],
      config : [
        { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
          value: x => convertToUnitsMacro(x, "FREQ", 1000)
	}
      ]
    },
    { zephyr: "w1", datamodel: "OWM", enable: "ENABLE",
      pins : [
          { name: "owm_io_p1_31", signal: "IO", pin: "G8" },
          { name: "owm_io_p0_8", signal: "IO", pin: "F1" },
          { name: "owm_pe_p0_7", signal: "PE", pin: "F2" },
          { name: "owm_pe_p1_30", signal: "PE", pin: "F8" }
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
    { zephyr : "spi0", datamodel : "SPI0", enable : "SPI0_ENABLE",
      pins : [
        { name: "spi0a_ss0_p0_22", signal: "CS0", pin: "C1" },
        { name: "spi0b_miso_p2_27", signal: "MISO", pin: "B2" },
        { name: "spi0b_mosi_p2_28", signal: "MOSI", pin: "B1" },
        { name: "spi0b_sck_p2_29", signal: "SCK", pin: "C3" },
        { name: "spi0b_sdio2_p2_30", signal: "SDIO2", pin: "B3" },
        { name: "spi0b_sdio3_p2_31", signal: "SDIO3", pin: "C2" },
        { name: "spi0b_ss1_p2_26", signal: "CS1", pin: "A2" }
      ],
      config : [
        { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "15000000",
          value: x => convertToUnitsMacro(x, "FREQ", 1000)
	}
      ]
    },
    { zephyr : "spi1", datamodel : "SPI1", enable : "SPI1_ENABLE",
      pins : [
        { name: "spi1a_miso_p1_28", signal: "MISO", pin: "B7" },
        { name: "spi1a_mosi_p1_29", signal: "MOSI", pin: "A7" },
        { name: "spi1a_sck_p1_26", signal: "SCK", pin: "B8" },
        { name: "spi1a_ss0_p1_23", signal: "CS0", pin: "C8" },
        { name: "spi1a_ss1_p1_25", signal: "CS1", pin: "E7" },
        { name: "spi1a_ss2_p1_24", signal: "CS2", pin: "D7" },
        { name: "spi1b_sdio2_p1_30", signal: "SDIO2", pin: "F8" },
        { name: "spi1b_sdio3_p1_31", signal: "SDIO3", pin: "G8" }
      ],
      config : [
        { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "15000000",
          value: x => convertToUnitsMacro(x, "FREQ", 1000)
	}
      ]
    },
    { zephyr : "spi2", datamodel : "SPI2", enable : "SPI2_ENABLE",
      pins : [
        { name: "spi2a_miso_p2_3", signal: "MISO", pin: "B6" },
        { name: "spi2a_mosi_p2_4", signal: "MOSI", pin: "C6" },
        { name: "spi2a_sck_p2_2", signal: "SCK", pin: "A6" },
        { name: "spi2a_ss0_p2_5", signal: "CS0", pin: "D6" },
        { name: "spi2a_ss1_p2_1", signal: "CS1", pin: "E6" },
        { name: "spi2a_ss2_p1_27", signal: "CS2", pin: "C7" },
        { name: "spi2b_sdio2_p2_6", signal: "SDIO2", pin: "C4" },
        { name: "spi2b_sdio3_p2_7", signal: "SDIO3", pin: "E5" }
      ],
      config : [
        { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "15000000",
          value: x => convertToUnitsMacro(x, "FREQ", 1000)
	}
      ]
    },
    { zephyr : "spi3", datamodel : "SPI3", enable : "SPI3_ENABLE",
      pins : [
        { name: "spi3a_miso_p0_20", signal: "MISO", pin: "K3" },
        { name: "spi3a_mosi_p0_21", signal: "MOSI", pin: "L2" },
        { name: "spi3a_sck_p0_16", signal: "SCK", pin: "L3" },
        { name: "spi3a_sdio2_p0_17", signal: "SDIO2", pin: "J3" },
        { name: "spi3a_sdio3_p0_15", signal: "SDIO3", pin: "K2" },
        { name: "spi3a_ss0_p0_19", signal: "CS0", pin: "M3" },
        { name: "spi3a_ss1_p0_13", signal: "CS1", pin: "J2" },
        { name: "spi3a_ss2_p0_14", signal: "CS2", pin: "K1" }
      ],
      config : [
        { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "15000000",
          value: x => convertToUnitsMacro(x, "FREQ", 1000)
	}
      ]
    },
    { zephyr : "spi4", datamodel : "SPI4", enable : "SPI4_ENABLE",
      pins : [
        { name: "spi4a_miso_p1_2", signal: "MISO", pin: "J5" },
        { name: "spi4a_mosi_p1_1", signal: "MOSI", pin: "K4" },
        { name: "spi4a_sck_p1_3", signal: "SCK", pin: "K5" },
        { name: "spi4a_sdio2_p1_4", signal: "SDIO2", pin: "L4" },
        { name: "spi4a_sdio3_p1_5", signal: "SDIO3", pin: "M5" },
        { name: "spi4a_ss0_p1_0", signal: "CS0", pin: "H5" },
        { name: "spi4a_ss1_p1_6", signal: "CS1", pin: "L5" },
        { name: "spi4a_ss2_p1_11", signal: "CS2", pin: "L6" }
      ],
      config : [
        { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "15000000",
          value: x => convertToUnitsMacro(x, "FREQ", 1000)
	}
      ]
    },
    { zephyr : "timer0", datamodel : "TMR0", enable : "TMR0_ENABLE", clock_mux : "TMR0a_MUX", clock_default : "PCLK",
      pins : [
        { name: "tmr0b_iob_p0_14", signal: "IOB", pin: "K1"},
        { name: "tmr0b_ioa_p0_13", signal: "IOA", pin: "J2"},
        { name: "tmr0c_iobn_p0_10", signal: "IOBN", pin: "G7"},
        { name: "tmr0c_ioan_p0_9", signal: "IOAN", pin: "F7"},
        { name: "tmr0c_ioa_p0_4", signal: "IOA", pin: "E3"}
      ],
      subnode: () => getAssignedPeripheral("TMR0").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR0").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config : [
        { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1" }
      ]
    },
    { zephyr : "timer1", datamodel : "TMR1", enable : "TMR1_ENABLE", clock_mux : "TMR1a_MUX", clock_default : "PCLK",
      pins : [
        { name: "tmr1c_ioa_p0_15", signal: "IOA", pin: "K2"},
        { name: "tmr1c_iob_p0_17", signal: "IOB", pin: "J3"},
        { name: "tmr1c_ioan_p0_11", signal: "IOAN", pin: "G2"},
        { name: "tmr1c_iobn_p0_12", signal: "IOBN", pin: "G3"},
        { name: "tmr1b_iob_p0_8", signal: "IOB", pin: "F1"},
        { name: "tmr1b_ioa_p0_7", signal: "IOA", pin: "F2"}
      ],
      subnode: () => getAssignedPeripheral("TMR1").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR1").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config : [
        { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1" }
      ]
    },
    { zephyr : "timer2", datamodel : "TMR2", enable : "TMR2_ENABLE", clock_mux : "TMR2a_MUX", clock_default : "PCLK",
      pins : [
        { name: "tmr2b_iob_p1_5", signal: "IOB", pin: "M5"},
        { name: "tmr2b_ioa_p1_4", signal: "IOA", pin: "L4"},
        { name: "tmr2c_iob_p2_21", signal: "IOB", pin: "J9"},
        { name: "tmr2c_ioa_p2_20", signal: "IOA", pin: "H9"},
        { name: "tmr2c_iob_p0_5", signal: "IOB", pin: "E2"}
      ],
      subnode: () => getAssignedPeripheral("TMR2").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR2").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config : [
        { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1" }
      ]
    },
    { zephyr : "timer3", datamodel : "TMR3", enable : "TMR3_ENABLE", clock_mux : "TMR3a_MUX", clock_default : "PCLK",
      pins : [
        { name: "tmr3a_iob_p1_14", signal: "IOB", pin: "M11"},
        { name: "tmr3a_ioa_p1_13", signal: "IOA", pin: "L7"},
        { name: "tmr3c_iob_p2_31", signal: "IOB", pin: "C2"},
        { name: "tmr3c_ioa_p2_30", signal: "IOA", pin: "B3"}
      ],
      subnode: () => getAssignedPeripheral("TMR3").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR3").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config : [
        { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1" }
      ]
    },
    { zephyr : "lptimer0", datamodel : "LPTMR0", enable : "ENABLE", clock_mux : "MUX", clock_default : "IBRO",
      pins : [
        { name: "lptmr0b_ioa_p3_4", signal: "IOA", pin: "F10"}
      ],
      subnode: () => getAssignedPeripheral("LPTMR0").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("LPTMR0").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config : [
        { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1" }
      ]
    },
    { zephyr : "lptimer1", datamodel : "LPTMR1", enable : "ENABLE", clock_mux : "MUX", clock_default : "IBRO",
      pins : [
        { name: "lptmr1b_ioa_p3_7", signal: "IOA", pin: "D10"}
      ],
      subnode: () => getAssignedPeripheral("LPTMR1").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("LPTMR1").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config : [
        { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1" }
      ]
    },
    { zephyr : "trng", datamodel : "TRNG", enable : "TRNG_ENABLE" },
    { zephyr : "uart0", datamodel : "UART0", enable : "UART0_ENABLE", clock_mux : "UART0_MUX", clock_default : "PCLK",
      pins : [
        { name: "uart0a_cts_p2_9", signal: "CTS", pin: "A5" },
        { name: "uart0a_rts_p2_10", signal: "RTS", pin: "B5" },
        { name: "uart0a_rx_p2_11", signal: "RX", pin: "C5" },
        { name: "uart0a_tx_p2_12", signal: "TX", pin: "D5" }
      ],
      config : [
        { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200" },
        { name: "hw-flow-control", type: "boolean", control: "HW_FLOW_CTRL", cfg_default: "DISABLED",
          value: x => x !== "DISABLED"
        },
        { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
          value: x => (x === "DISABLED" ? "none" : (x === "EVEN" ? "even" : "odd"))
	},
        { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
          value: x => (x === "1" ? "1" : (getAssignedPeripheral("UART0").Config?.CHAR_SIZE === "5" ? "1_5" : "2"))
        },
        { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5" }
      ]
    },
    { zephyr : "uart1", datamodel : "UART1", enable : "UART1_ENABLE", clock_mux : "UART1_MUX", clock_default : "PCLK",
      pins : [
        { name: "uart1a_cts_p2_13", signal: "CTS", pin: "H6" },
        { name: "uart1a_rts_p2_15", signal: "RTS", pin: "J7" },
        { name: "uart1a_rx_p2_14", signal: "RX", pin: "J6" },
        { name: "uart1a_tx_p2_16", signal: "TX", pin: "H7" }
      ],
      config : [
        { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200" },
        { name: "hw-flow-control", type: "boolean", control: "HW_FLOW_CTRL", cfg_default: "DISABLED",
          value: x => x !== "DISABLED"
        },
        { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
          value: x => (x === "DISABLED" ? "none" : (x === "EVEN" ? "even" : "odd"))
	},
        { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
          value: x => (x === "1" ? "1" : (getAssignedPeripheral("UART1").Config?.CHAR_SIZE === "5" ? "1_5" : "2"))
        },
        { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5" }
      ]
    },
    { zephyr : "uart2", datamodel : "UART2", enable : "UART2_ENABLE", clock_mux : "UART2_MUX", clock_default : "PCLK",
      pins : [
        { name: "uart2a_cts_p1_7", signal: "CTS", pin: "J4" },
        { name: "uart2a_rts_p1_8", signal: "RTS", pin: "M2" },
        { name: "uart2a_rx_p1_9", signal: "RX", pin: "L1" },
        { name: "uart2a_tx_p1_10", signal: "TX", pin: "H4" },
        { name: "uart2c_cts_p0_2", signal: "CTS", pin: "D3" },
        { name: "uart2c_rts_p0_3", signal: "RTS", pin: "D1" },
        { name: "uart2c_rx_p0_6", signal: "RX", pin: "E1" },
        { name: "uart2c_tx_p0_1", signal: "TX", pin: "D2" }
      ],
      config : [
        { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200" },
        { name: "hw-flow-control", type: "boolean", control: "HW_FLOW_CTRL", cfg_default: "DISABLED",
          value: x => x !== "DISABLED"
        },
        { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
          value: x => (x === "DISABLED" ? "none" : (x === "EVEN" ? "even" : "odd"))
	},
        { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
          value: x => (x === "1" ? "1" : (getAssignedPeripheral("UART2").Config?.CHAR_SIZE === "5" ? "1_5" : "2"))
        },
        { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5" }
      ]
    },
    { zephyr : "uart3", datamodel : "LPUART0", enable : "ENABLE", clock_mux : "MUX", clock_default : "IBRO",
      pins : [
        { name: "lpuart0b_cts_p3_2", signal: "CTS", pin: "H12" },
        { name: "lpuart0b_rts_p3_3", signal: "RTS", pin: "G10" },
        { name: "lpuart0b_rx_p3_0", signal: "RX", pin: "H10" },
        { name: "lpuart0b_tx_p3_1", signal: "TX", pin: "H11" }
      ],
      config : [
        { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200" },
        { name: "hw-flow-control", type: "boolean", control: "HW_FLOW_CTRL", cfg_default: "DISABLED",
          value: x => x !== "DISABLED"
        },
        { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
          value: x => (x === "DISABLED" ? "none" : (x === "EVEN" ? "even" : "odd"))
	},
        { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
          value: x => (x === "1" ? "1" : (getAssignedPeripheral("LPUART0").Config?.CHAR_SIZE === "5" ? "1_5" : "2"))
        },
        { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5" }
      ]
    },
    { zephyr: "usbhs", datamodel: "USBHS", enable: "ENABLE"},
    { zephyr : "wdt0", datamodel : "WDT0", enable : "ENABLE", clock_mux : "MUX", clock_default : "PCLK" },
    { zephyr : "wdt1", datamodel : "LPWDT0", enable : "ENABLE", clock_mux : "MUX", clock_default : "IBRO" }
  ];

} else {

  peripheralData = [
    { zephyr : "adc", datamodel : "ADC", enable : "ENABLE", clock_mux : "MUX", clock_default : "SYS_CLK",
      pins : [
        { signal: "TRIG_A", pin: "10", name: "adc_trig_a_p0_10"},
        { signal: "AIN0", pin: "39", name: "ain0_p3_0"},
        { signal: "AIN1", pin: "40", name: "ain1_p3_1"},
        { signal: "AIN4", pin: "41", name: "ain4_p3_4"},
        { signal: "CLK_EXT", pin: "9", name: "adc_clk_ext_p0_9"}
      ],
      config : [
        { name: "clock-divider", type: "int", clocknode: "ADC", control: "DIV", cfg_default: "16" },
        { name: "track-count", type: "int", control: "TRACK_CNT", cfg_default: "0" },
        { name: "idle-count", type: "int", control: "IDLE_CNT", cfg_default: "0" }
      ]
    },
    { zephyr: "can0", datamodel: "CAN0", enable: "CAN0_ENABLE",
      pins: [
          { signal: "TX", pin: "33", name: "can0b_tx_p2_23"},
          { signal: "RX", pin: "34", name: "can0b_rx_p2_22"}
      ]
    },
    { zephyr: "can1", datamodel: "CAN1", enable: "CAN1_ENABLE",
      pins: [
          { signal: "TX", pin: "6", name: "can1b_tx_p2_25"},
          { signal: "RX", pin: "64", name: "can1b_rx_p2_24"}
      ]
    },
    { zephyr : "dma0", datamodel : "DMA", enable : "ENABLE" },
    { zephyr : "i2c0", datamodel : "I2C0", enable : "I2C0_ENABLE",
      pins : [
        { name: "i2c0a_scl_p2_8", signal: "SCL", pin: "2" },
        { name: "i2c0a_sda_p2_7", signal: "SDA", pin: "1" }
      ],
      config : [
        { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
          value: x => convertToUnitsMacro(x, "FREQ", 1000)
	}
      ]
    },
    { zephyr : "i2c2", datamodel : "I2C2", enable : "I2C2_ENABLE",
      pins : [
        { name: "i2c2c_scl_p0_14", signal: "SCL", pin: "14" },
        { name: "i2c2c_scl_p1_8", signal: "SCL", pin: "18" },
        { name: "i2c2c_sda_p1_7", signal: "SDA", pin: "17" }
      ],
      config : [
        { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
          value: x => convertToUnitsMacro(x, "FREQ", 1000)
	}
      ]
    },
    { zephyr: "w1", datamodel: "OWM", enable: "ENABLE",
      pins : [
        { name: "owm_pe_p0_7", signal: "PE", pin: "7" },
        { name: "owm_io_p0_8", signal: "IO", pin: "8" }
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
    { zephyr : "spi0", datamodel : "SPI0", enable : "SPI0_ENABLE",
      pins : [
        { name: "spi0b_miso_p2_27", signal: "MISO", pin: "3" },
        { name: "spi0b_mosi_p2_28", signal: "MOSI", pin: "5" },
        { name: "spi0b_sck_p2_29", signal: "SCK", pin: "4" },
        { name: "spi0b_ss1_p2_26", signal: "CS1", pin: "68" }
      ],
      config : [
        { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "15000000",
          value: x => convertToUnitsMacro(x, "FREQ", 1000)
	}
      ]
    },
    { zephyr : "timer0", datamodel : "TMR0", enable : "TMR0_ENABLE", clock_mux : "TMR0a_MUX", clock_default : "PCLK",
      pins : [
        { name: "tmr0c_iobn_p0_10", signal: "IOBN", pin: "10"},
        { name: "tmr0b_iob_p0_14", signal: "IOB", pin: "14"},
        { name: "tmr0c_ioan_p0_9", signal: "IOAN", pin: "9"}
      ],
      subnode: () => getAssignedPeripheral("TMR0").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR0").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config : [
        { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1" }
      ]
    },
    { zephyr : "timer1", datamodel : "TMR1", enable : "TMR1_ENABLE", clock_mux : "TMR1a_MUX", clock_default : "PCLK",
      pins : [
        { name: "tmr1b_ioa_p0_7", signal: "IOA", pin: "7"},
        { name: "tmr1b_iob_p0_8", signal: "IOB", pin: "8"}
      ],
      subnode: () => getAssignedPeripheral("TMR1").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR1").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config : [
        { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1" }
      ]
    },
    { zephyr : "timer2", datamodel : "TMR2", enable : "TMR2_ENABLE", clock_mux : "TMR2a_MUX", clock_default : "PCLK",
      pins : [
      ],
      subnode: () => getAssignedPeripheral("TMR2").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR2").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config : [
        { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1" }
      ]
    },
    { zephyr : "timer3", datamodel : "TMR3", enable : "TMR3_ENABLE", clock_mux : "TMR3a_MUX", clock_default : "PCLK",
      pins : [
        { name: "tmr3a_ioa_p1_13", signal: "IOA", pin: "23"},
        { name: "tmr3a_iob_p1_14", signal: "IOB", pin: "32"}
      ],
      subnode: () => getAssignedPeripheral("TMR3").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR3").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config : [
        { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1" }
      ]
    },
    { zephyr : "lptimer0", datamodel : "LPTMR0", enable : "ENABLE", clock_mux : "MUX", clock_default : "IBRO",
      pins : [
        { name: "lptmr0b_ioa_p3_4", signal: "IOA", pin: "41"}
      ],
      subnode: () => getAssignedPeripheral("LPTMR0").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("LPTMR0").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config : [
        { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1" }
      ]
    },
    { zephyr : "lptimer1", datamodel : "LPTMR1", enable : "ENABLE", clock_mux : "MUX", clock_default : "IBRO",
      pins : [
      ],
      subnode: () => getAssignedPeripheral("LPTMR1").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("LPTMR1").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config : [
        { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1" }
      ]
    },
    { zephyr : "trng", datamodel : "TRNG", enable : "TRNG_ENABLE" },
    { zephyr : "uart0", datamodel : "UART0", enable : "UART0_ENABLE", clock_mux : "UART0_MUX", clock_default : "PCLK",
      pins : [
        { name: "uart0a_rx_p2_11", signal: "RX", pin: "66" },
        { name: "uart0a_tx_p2_12", signal: "TX", pin: "67" }
      ],
      config : [
        { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200" },
        { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
          value: x => (x === "DISABLED" ? "none" : (x === "EVEN" ? "even" : "odd"))
	},
        { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
          value: x => (x === "1" ? "1" : (getAssignedPeripheral("UART0").Config?.CHAR_SIZE === "5" ? "1_5" : "2"))
        },
        { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5" }
      ]
    },
    { zephyr : "uart2", datamodel : "UART2", enable : "UART2_ENABLE", clock_mux : "UART2_MUX", clock_default : "PCLK",
      pins : [
        { name: "uart2a_cts_p1_7", signal: "CTS", pin: "17" },
        { name: "uart2a_rts_p1_8", signal: "RTS", pin: "18" },
        { name: "uart2a_rx_p1_9", signal: "RX", pin: "15" },
        { name: "uart2a_tx_p1_10", signal: "TX", pin: "16" }
      ],
      config : [
        { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200" },
        { name: "hw-flow-control", type: "boolean", control: "HW_FLOW_CTRL", cfg_default: "DISABLED",
          value: x => x !== "DISABLED"
        },
        { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
          value: x => (x === "DISABLED" ? "none" : (x === "EVEN" ? "even" : "odd"))
	},
        { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
          value: x => (x === "1" ? "1" : (getAssignedPeripheral("UART2").Config?.CHAR_SIZE === "5" ? "1_5" : "2"))
        },
        { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5" }
      ]
    },
    { zephyr : "uart3", datamodel : "LPUART0", enable : "ENABLE", clock_mux : "MUX", clock_default : "IBRO",
      pins : [
        { name: "lpuart0b_rx_p3_0", signal: "RX", pin: "39" },
        { name: "lpuart0b_tx_p3_1", signal: "TX", pin: "40" }
      ],
      config : [
        { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200" },
        { name: "hw-flow-control", type: "boolean", control: "HW_FLOW_CTRL", cfg_default: "DISABLED",
          value: x => x !== "DISABLED"
        },
        { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
          value: x => (x === "DISABLED" ? "none" : (x === "EVEN" ? "even" : "odd"))
	},
        { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
          value: x => (x === "1" ? "1" : (getAssignedPeripheral("LPUART0").Config?.CHAR_SIZE == "5" ? "1_5" : "2"))
        },
        { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5" }
      ]
    },
    { zephyr: "usbhs", datamodel: "USBHS", enable: "ENABLE"},
    { zephyr : "wdt0", datamodel : "WDT0", enable : "ENABLE", clock_mux : "MUX", clock_default : "PCLK" },
    { zephyr : "wdt1", datamodel : "LPWDT0", enable : "ENABLE", clock_mux : "MUX", clock_default : "IBRO" }
  ];

}

unsupported_in_dts = [
    { datamodel: "BLE", diag: "The Bluetooth Low Energy peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE" },
    { datamodel: "CTB", diag: "The Cryptographic Toolbox peripheral is not currently supported in devicetree.", ctrl: "CTB_ENABLE", value: "TRUE" },
    { datamodel: "EMCC", diag: "The External Memory Cache Controller is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE" },
    { datamodel: "HYP", diag: "The SPIXR/HPB peripherals are not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE" },
    { datamodel: "I2S0", diag: "The Inter-IC Sound Interface peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE" },
    { datamodel: "LPCMP", diag: "The Low-Power Comparator peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE" },
    { datamodel: "PT0", diag: "The Pulse Train Engine PT0 is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE" },
    { datamodel: "PT1", diag: "The Pulse Train Engine PT1 is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE" },
    { datamodel: "PT2", diag: "The Pulse Train Engine PT2 is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE" },
    { datamodel: "PT3", diag: "The Pulse Train Engine PT3 is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE" },
    { datamodel: "PT4", diag: "The Pulse Train Engine PT4 is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE" },
    { datamodel: "PT5", diag: "The Pulse Train Engine PT5 is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE" },
    { datamodel: "PT6", diag: "The Pulse Train Engine PT6 is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE" },
    { datamodel: "PT7", diag: "The Pulse Train Engine PT7 is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE" },
    { datamodel: "PT8", diag: "The Pulse Train Engine PT8 is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE" },
    { datamodel: "PT9", diag: "The Pulse Train Engine PT9 is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE" },
    { datamodel: "PT10", diag: "The Pulse Train Engine PT10 is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE" },
    { datamodel: "PT11", diag: "The Pulse Train Engine PT11 is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE" },
    { datamodel: "PT12", diag: "The Pulse Train Engine PT12 is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE" },
    { datamodel: "PT13", diag: "The Pulse Train Engine PT13 is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE" },
    { datamodel: "PT14", diag: "The Pulse Train Engine PT14 is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE" },
    { datamodel: "PT15", diag: "The Pulse Train Engine PT15 is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE" },
    { datamodel: "PUF", diag: "The ChipDNA PUF peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE" },
    { datamodel: "SEMA", diag: "The Semaphore peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE" },
    { datamodel: "SPIFX", diag: "The SPI Execute-In-Place Flash peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE" },
    { datamodel: "USBHS", diag: "The USB peripheral CLKEXT clock source is not currently supported in devicetree.", ctrl: "USB_MUX", value: "USBCLKEXT" },
    { datamodel: "USBHS", diag: "The USB peripheral ERFO clock source is not currently supported in devicetree.", ctrl: "USB_MUX", value: "ERFO" },
    { datamodel: "RTC", clocknode: "SQWOUT", diag: "Enabling SQWOUT from the RTC is not currently supported in devicetree.", ctrl: "SQWOUT", value: "1HZ" },
    { datamodel: "RTC", clocknode: "SQWOUT", diag: "Enabling SQWOUT from the RTC is not currently supported in devicetree.", ctrl: "SQWOUT", value: "512HZ" },
    { datamodel: "RTC", clocknode: "SQWOUT", diag: "Enabling SQWOUT from the RTC is not currently supported in devicetree.", ctrl: "SQWOUT", value: "4KHZ" },
    { datamodel: "RTC", clocknode: "SQWOUT", diag: "Enabling SQWOUT from the RTC is not currently supported in devicetree.", ctrl: "SQWOUT", value: "32KHZ" },
    { clocknode: "ERTCO Mux", diag: "Bypass of the ERTCO is not currently supported in devicetree.", ctrl: "MUX", value: "ERTCO_CLK" },
    { clocknode: "ERFO Mux", diag: "Bypass of the ERFO is not currently supported in devicetree.", ctrl: "MUX", value: "ERFO_CLK" },
    { clocknode: "LPM Mux", diag: "Setting the LPM Mux is not currently supported in devicetree.", ctrl: "MUX", value: "SYS_CLK_DIV_2_ISO" }
]

function mapClockName(clock) {
    if (clock === "CLKEXT") {
        return "extclk";
    } else if (clock === "IBRO_DIV_8") {
        return "ibro";
    } else if (clock === "LPTMR0_CLK") {
        return undefined;
    } else if (clock === "LPTMR1_CLK") {
        return undefined;
    } else if (clock === "PCLK") {
        return undefined;
    } else if (clock === "ADC_CLK_EXT") {
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
