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

peripheralData = [
    { zephyr: "adc", datamodel: "ADC", enable: "ENABLE",
      pins: [
          { signal: "AIN0", pin: "D7", name: "ain0_p2_0"},
          { signal: "AIN2", pin: "E7", name: "ain2_p2_2"},
          { signal: "AIN1", pin: "E8", name: "ain1_p2_1"},
          { signal: "AIN5", pin: "F7", name: "ain5_p2_5"},
          { signal: "AIN4", pin: "F8", name: "ain4_p2_4"},
          { signal: "AIN3", pin: "F9", name: "ain3_p2_3"},
          { signal: "AIN6", pin: "G8", name: "ain6_p2_6"},
          { signal: "AIN7", pin: "G9", name: "ain7_p2_7"}
      ]},
    { zephyr: "flc0", datamodel: "FLC0"},
    { zephyr: "i2c0", datamodel: "I2C0", enable: "I2C0_ENABLE",
      pins: [
          { signal: "SDA", pin: "D6", name: "i2c0_sda_p0_11"},
          { signal: "SCL", pin: "E6", name: "i2c0_scl_p0_10"}
      ],
      config: [
        { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
          value: x => convertToUnitsMacro(x, "FREQ", 1000)
        }
      ]},
    { zephyr: "i2c1", datamodel: "I2C1", enable: "I2C1_ENABLE",
      pins: [
          { signal: "SCL", pin: "D5", name: "i2c1_scl_p0_16"},
          { signal: "SDA", pin: "H4", name: "i2c1_sda_p0_17"}
      ],
      config: [
        { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
          value: x => convertToUnitsMacro(x, "FREQ", 1000)
        }
      ]},
    { zephyr: "i2c2", datamodel: "I2C2", enable: "I2C2_ENABLE",
      pins: [
          { signal: "SDA", pin: "G2", name: "i2c2_sda_p0_31"},
          { signal: "SCL", pin: "H1", name: "i2c2_scl_p0_30"}
      ],
      config: [
        { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
          value: x => convertToUnitsMacro(x, "FREQ", 1000)
        }
      ]},
    { zephyr: "lptimer0", datamodel: "LPTMR0", enable: "ENABLE",  clock_mux: "MUX", clock_default: "IBRO",
      pins: [
          { signal: "IOA", pin: "F8", name: "lptmr0b_ioa_p2_4"},
          { signal: "CLK", pin: "G8", name: "lptmr0_clk_p2_6"}
      ],
      subnode: () => getAssignedPeripheral("LPTMR0").Config?.MODE_A === "COMPARE" ? "counter": "pwm",
      pins_node: () => getAssignedPeripheral("LPTMR0").Config?.MODE_A === "COMPARE" ? undefined: "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { zephyr: "lptimer1", datamodel: "LPTMR1", enable: "ENABLE", clock_mux: "MUX", clock_default: "IBRO",
      pins: [
          { signal: "IOA", pin: "F7", name: "lptmr1b_ioa_p2_5"},
          { signal: "CLK", pin: "G9", name: "lptmr1_clk_p2_7"}
      ],
      subnode: () => getAssignedPeripheral("LPTMR1").Config?.MODE_A === "COMPARE" ? "counter": "pwm",
      pins_node: () => getAssignedPeripheral("LPTMR1").Config?.MODE_A === "COMPARE" ? undefined: "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { zephyr: "w1", datamodel: "OWM", enable: "ENABLE",
      pins: [
          { signal: "PE", pin: "F4", name: "owm_pe_p0_19"},
          { signal: "IO", pin: "G4", name: "owm_io_p0_18"},
          { signal: "IO", pin: "G7", name: "owm_io_p0_6"},
          { signal: "PE", pin: "H6", name: "owm_pe_p0_7"}
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
      ]},
    { datamodel: "RTC", zephyr: "rtc_counter" },
    { zephyr: "spi0", datamodel: "SPI0", enable: "ENABLE",
      pins: [
          { signal: "CS1", pin: "D6", name: "spi0_ss1_p0_11"},
          { signal: "CS2", pin: "E6", name: "spi0_ss2_p0_10"},
          { signal: "SDIO3", pin: "F6", name: "spi0_sdio3_p0_9"},
          { signal: "SDIO2", pin: "G6", name: "spi0_sdio2_p0_8"},
          { signal: "MISO", pin: "G7", name: "spi0_miso_p0_6"},
          { signal: "SCK", pin: "H6", name: "spi0_sck_p0_7"},
          { signal: "MOSI", pin: "H7", name: "spi0_mosi_p0_5"},
          { signal: "CS0", pin: "J7", name: "spi0_ss0_p0_4"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "60000000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { zephyr: "spi1", datamodel: "SPI1", enable: "ENABLE",
      pins: [
          { signal: "MOSI", pin: "D4", name: "spi1_mosi_p0_21"},
          { signal: "CS0", pin: "E4", name: "spi1_ss0_p0_20"},
          { signal: "SDIO3", pin: "F3", name: "spi1_sdio3_p0_25"},
          { signal: "SDIO2", pin: "G3", name: "spi1_sdio2_p0_24"},
          { signal: "SCK", pin: "H3", name: "spi1_sck_p0_23"},
          { signal: "MISO", pin: "J3", name: "spi1_miso_p0_22"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "60000000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { zephyr: "timer0", datamodel: "TMR0", enable: "TMR0_ENABLE", clock_mux: "TMR0a_MUX", clock_default: "PCLK",
      pins: [
          { signal: "IOB", pin: "F6", name: "tmr0b_iob_p0_9"},
          { signal: "IOA", pin: "G6", name: "tmr0b_ioa_p0_8"},
          { signal: "IOBN", pin: "H7", name: "tmr0b_iobn_p0_5"},
          { signal: "IOB", pin: "H8", name: "tmr0a_iob_p0_3"},
          { signal: "IOAN", pin: "J7", name: "tmr0b_ioan_p0_4"},
          { signal: "IOA", pin: "J8", name: "tmr0a_ioa_p0_2"}
      ],
      subnode: () => getAssignedPeripheral("TMR0").Config?.MODE_A === "COMPARE" ? "counter": "pwm",
      pins_node: () => getAssignedPeripheral("TMR0").Config?.MODE_A === "COMPARE" ? undefined: "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { zephyr: "timer1", datamodel: "TMR1", enable: "TMR1_ENABLE", clock_mux: "TMR1a_MUX", clock_default: "PCLK",
      pins: [
          { signal: "IOB", pin: "E5", name: "tmr1a_iob_p0_15"},
          { signal: "IOA", pin: "F5", name: "tmr1a_ioa_p0_14"},
          { signal: "IOBN", pin: "G5", name: "tmr1b_iobn_p0_13"},
          { signal: "IOAN", pin: "H5", name: "tmr1b_ioan_p0_12"}
      ],
      subnode: () => getAssignedPeripheral("TMR1").Config?.MODE_A === "COMPARE" ? "counter": "pwm",
      pins_node: () => getAssignedPeripheral("TMR1").Config?.MODE_A === "COMPARE" ? undefined: "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { zephyr: "timer2", datamodel: "TMR2", enable: "TMR2_ENABLE", clock_mux: "TMR2a_MUX", clock_default: "PCLK",
      pins: [
          { signal: "IOA", pin: "E3", name: "tmr2_ioa_p0_26"},
          { signal: "IOB", pin: "J2", name: "tmr2_iob_p0_27"}
      ],
      subnode: () => getAssignedPeripheral("TMR2").Config?.MODE_A === "COMPARE" ? "counter": "pwm",
      pins_node: () => getAssignedPeripheral("TMR2").Config?.MODE_A === "COMPARE" ? undefined: "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { zephyr: "timer3", datamodel: "TMR3", enable: "TMR3_ENABLE", clock_mux: "TMR3a_MUX", clock_default: "PCLK",
      pins: [
          { signal: "IOA", pin: "B1", name: "tmr3a_ioa_p1_6"},
          { signal: "IOB", pin: "C2", name: "tmr3a_iob_p1_7"},
          { signal: "IOA", pin: "D2", name: "tmr3b_ioa_p1_4"},
          { signal: "IOB", pin: "D3", name: "tmr3b_iob_p1_5"}
      ],
      subnode: () => getAssignedPeripheral("TMR3").Config?.MODE_A === "COMPARE" ? "counter": "pwm",
      pins_node: () => getAssignedPeripheral("TMR3").Config?.MODE_A === "COMPARE" ? undefined: "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { zephyr: "trng", datamodel: "TRNG", enable: "TRNG_ENABLE"},
    { zephyr: "uart0", datamodel: "UART0", enable: "UART0_ENABLE", clock_mux: "UART0_MUX", clock_default: "PCLK",
      pins: [
          { signal: "RTS", pin: "H8", name: "uart0b_rts_p0_3"},
          { signal: "TX", pin: "H9", name: "uart0a_tx_p0_1"},
          { signal: "CTS", pin: "J8", name: "uart0b_cts_p0_2"},
          { signal: "RX", pin: "J9", name: "uart0a_rx_p0_0"}
      ],
      config: [
          { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200" },
          { name: "hw-flow-control", type: "boolean", control: "HW_FLOW_CTRL", cfg_default: "DISABLED",
            value: x => x !== "DISABLED"},
          { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
            value: x => (x === "DISABLED" ? "none": (x === "EVEN" ? "even": "odd"))},
          { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
            value: x => (x === "1" ? "1": (getAssignedPeripheral("UART0").Config?.CHAR_SIZE === "5" ? "1_5": "2"))},
          { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5"}
      ]},
    { zephyr: "uart1", datamodel: "UART1", enable: "UART1_ENABLE", clock_mux: "UART1_MUX", clock_default: "PCLK",
      pins: [
          { signal: "TX", pin: "G5", name: "uart1_tx_p0_13"},
          { signal: "RX", pin: "H5", name: "uart1_rx_p0_12"}
      ],
      config: [
          { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200" },
          { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
            value: x => (x === "DISABLED" ? "none": (x === "EVEN" ? "even": "odd"))},
          { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
            value: x => (x === "1" ? "1": (getAssignedPeripheral("UART1").Config?.CHAR_SIZE === "5" ? "1_5": "2"))},
          { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5"}
      ]},
    { zephyr: "uart2", datamodel: "UART2", enable: "UART2_ENABLE", clock_mux: "UART2_MUX", clock_default: "PCLK",
      pins: [
          { signal: "TX", pin: "F1", name: "uart2_tx_p1_1"},
          { signal: "RX", pin: "G1", name: "uart2_rx_p1_0"}
      ],
      config: [
          { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200" },
          { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
            value: x => (x === "DISABLED" ? "none": (x === "EVEN" ? "even": "odd"))},
          { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
            value: x => (x === "1" ? "1": (getAssignedPeripheral("UART2").Config?.CHAR_SIZE === "5" ? "1_5": "2"))},
          { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5"}
      ]},
    { zephyr: "dma0", datamodel: "DMA", enable: "ENABLE"},
    { zephyr: "uart3", datamodel: "LPUART0", enable: "ENABLE", clock_mux: "MUX", clock_default: "IBRO",
      pins: [
          { signal: "RX", pin: "G8", name: "lpuartb_rx_p2_6"},
          { signal: "TX", pin: "G9", name: "lpuartb_tx_p2_7"}
      ],
      config: [
          { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200" },
          { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
            value: x => (x === "DISABLED" ? "none": (x === "EVEN" ? "even": "odd"))},
          { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
            value: x => (x === "1" ? "1": (getAssignedPeripheral("LPUART0").Config?.CHAR_SIZE === "5" ? "1_5": "2"))},
          { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5"}
      ]},
      { zephyr: "wdt0", datamodel: "WDT0", enable: "ENABLE", clock_mux: "MUX", clock_default: "PCLK"},
      { zephyr: "wdt1", datamodel: "LPWDT0", enable: "ENABLE", clock_mux: "MUX", clock_default: "IBRO"}
];

unsupported_in_dts = [
    {datamodel: "AES", diag: "The Advanced Encryption Standard peripheral is not currently supported in devicetree.", ctrl: "AES_ENABLE", value: "TRUE"},
    {datamodel: "ADC", diag: "The clock divider for ADC is not currently supported in devicetree.", ctrl: "DIV"},
    {datamodel: "CNN", diag: "The Convolutional Neural Network peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "CRC", diag: "The Cyclic Redundancy Check peripheral is not currently supported in devicetree.", ctrl: "CRC_ENABLE", value: "TRUE"},
    {datamodel: "I2S", diag: "The Inter-IC Sound Interface peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "LPCMP", diag: "The Low-Power Comparator peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "PCIF", diag: "The Parallel Camera Interface peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "PT0", diag: "The Pulse Train Engines peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "PT1", diag: "The Pulse Train Engines peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "PT2", diag: "The Pulse Train Engines peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "PT3", diag: "The Pulse Train Engines peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "SEMA", diag: "The Semaphore peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "RTC", clocknode: "SQWOUT", diag: "Enabling SQWOUT from the RTC is not currently supported in devicetree.", ctrl: "SQWOUT", value: "1HZ"},
    {datamodel: "RTC", clocknode: "SQWOUT", diag: "Enabling SQWOUT from the RTC is not currently supported in devicetree.", ctrl: "SQWOUT", value: "512HZ"},
    {datamodel: "RTC", clocknode: "SQWOUT", diag: "Enabling SQWOUT from the RTC is not currently supported in devicetree.", ctrl: "SQWOUT", value: "4KHZ"},
    {datamodel: "RTC", clocknode: "SQWOUT", diag: "Enabling SQWOUT from the RTC is not currently supported in devicetree.", ctrl: "SQWOUT", value: "32KHZ"},
    {clocknode: "ERTCO Mux", diag: "Bypass of the ERTCO is not currently supported in devicetree.", ctrl: "MUX", value: "ERTCO_CLK"},
    {clocknode: "ERFO Mux", diag: "Bypass of the ERFO is not currently supported in devicetree.", ctrl: "MUX", value: "ERFO_CLK"},
    {clocknode: "LPM Mux", diag: "Setting the LPM Mux is not currently supported in devicetree.", ctrl: "MUX", value: "SYS_CLK_DIV_2_ISO"}
  ];


function mapClockName(clock) {
    if (clock === "P0.3") {
        return "extclk";
    } else if (clock === "IPLL_SYS") {
        return "ipll";
    } else if (clock === "PCLK") {
        return undefined;
    } else if (clock === "IBRO_DIV_8") {
        return "ibro";
    } else if (clock === "SYS_CLK") {
        return undefined;
    } else if (clock === "LPTMR0_CLK") {
        return undefined;
    } else if (clock === "LPTMR1_CLK") {
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
    clocksUsed.add(mapClockName(getClockSetting("SYS_OSC Mux", "MUX", "ISO")));
    return Array.from(clocksUsed).sort();
}
