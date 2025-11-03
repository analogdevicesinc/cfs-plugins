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
    { zephyr: "adc", datamodel: "ADC", enable: "ENABLE", clocknode: "ADC", clock_mux : "MUX", clock_default : "SYS_CLK",
      pins: [
          { signal: "AIN7", pin: "C3", name: "ain7_p2_7"},
          { signal: "AIN3", pin: "C4", name: "ain3_p2_3"},
          { signal: "AIN6", pin: "D3", name: "ain6_p2_6"},
          { signal: "AIN2", pin: "D4", name: "ain2_p2_2"},
          { signal: "AIN5", pin: "E3", name: "ain5_p2_5"},
          { signal: "AIN1", pin: "E4", name: "ain1_p2_1"},
          { signal: "AIN4", pin: "F3", name: "ain4_p2_4"},
          { signal: "AIN0", pin: "F4", name: "ain0_p2_0"},
          { signal: "HW_TRIG_B", pin: "K12", name: "adc_hw_trig_b_p1_13"},
          { signal: "CLK_EXT", pin: "K13", name: "adc_clk_ext_p1_10"},
          { signal: "HW_TRIG_A", pin: "L11", name: "adc_hw_trig_a_p1_12"},
          { signal: "HW_TRIG_C", pin: "L12", name: "adc_hw_trig_c_p1_14"}
      ],
      config : [
        { name: "clock-divider", type: "int", clocknode: "ADC", control: "DIV", cfg_default: "16" },
        { name: "track-count", type: "int", control: "TRACK_CNT", cfg_default: "0" },
        { name: "idle-count", type: "int", control: "IDLE_CNT", cfg_default: "0" }
      ]},
    { zephyr: "dma0", datamodel: "DMA", enable: "ENABLE"},
    { zephyr: "flc0", datamodel: "FLC0"},
    { zephyr: "i2c0", datamodel: "I2C0", enable: "I2C0_ENABLE",
      pins: [
          { signal: "SDA", pin: "D8", name: "i2c0_sda_p0_11"},
          { signal: "SCL", pin: "D9", name: "i2c0_scl_p0_10"}
      ],
      config : [
        { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
          value: x => convertToUnitsMacro(x, "FREQ", 1000)
        }
      ]},
    { zephyr: "i2c1", datamodel: "I2C1", enable: "I2C1_ENABLE",
      pins: [
          { signal: "SDA", pin: "D6", name: "i2c1_sda_p0_17"},
          { signal: "SCL", pin: "D7", name: "i2c1_scl_p0_16"}
      ],
      config : [
        { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
          value: x => convertToUnitsMacro(x, "FREQ", 1000)
        }
      ]},
    { zephyr: "i2c2", datamodel: "I2C2", enable: "I2C2_ENABLE",
      pins: [
          { signal: "SCL", pin: "K5", name: "i2c2_scl_p0_30"},
          { signal: "SDA", pin: "L5", name: "i2c2_sda_p0_31"}
      ],
      config : [
        { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
          value: x => convertToUnitsMacro(x, "FREQ", 1000)
        }
      ]},
    { zephyr: "lptimer0", datamodel: "LPTMR0", enable: "ENABLE", clock_mux : "MUX", clock_default : "IBRO",
      pins: [
          { signal: "CLK", pin: "D3", name: "lptmr0_clk_p2_6"},
          { signal: "IOA", pin: "F3", name: "lptmr0b_ioa_p2_4"}
      ],
      subnode: () => getAssignedPeripheral("LPTMR0").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("LPTMR0").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { zephyr: "lptimer1", datamodel: "LPTMR1", enable: "ENABLE", clock_mux : "MUX", clock_default : "IBRO",
      pins: [
          { signal: "CLK", pin: "C3", name: "lptmr1_clk_p2_7"},
          { signal: "IOA", pin: "E3", name: "lptmr1b_ioa_p2_5"}
      ],
      subnode: () => getAssignedPeripheral("LPTMR1").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("LPTMR1").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { zephyr: "w1", datamodel: "OWM", enable: "ENABLE",
      pins: [
          { signal: "IO", pin: "C2", name: "owm_io_p0_6"},
          { signal: "PE", pin: "D2", name: "owm_pe_p0_7"},
          { signal: "IO", pin: "H10", name: "owm_io_p0_18"},
          { signal: "PE", pin: "J10", name: "owm_pe_p0_19"}
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
          { signal: "MOSI", pin: "B2", name: "spi0_mosi_p0_5"},
          { signal: "MISO", pin: "C2", name: "spi0_miso_p0_6"},
          { signal: "SCK", pin: "D2", name: "spi0_sck_p0_7"},
          { signal: "CS1", pin: "D8", name: "spi0_ss1_p0_11"},
          { signal: "CS2", pin: "D9", name: "spi0_ss2_p0_10"},
          { signal: "SDIO2", pin: "E2", name: "spi0_sdio2_p0_8"},
          { signal: "SDIO3", pin: "F2", name: "spi0_sdio3_p0_9"},
          { signal: "CS0", pin: "H4", name: "spi0_ss0_p0_4"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "15000000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { zephyr: "spi1", datamodel: "SPI1", enable: "ENABLE",
      pins: [
          { signal: "MOSI", pin: "A1", name: "spi1_mosi_p0_21"},
          { signal: "MISO", pin: "B1", name: "spi1_miso_p0_22"},
          { signal: "SCK", pin: "C1", name: "spi1_sck_p0_23"},
          { signal: "CS0", pin: "J4", name: "spi1_ss0_p0_20"},
          { signal: "SDIO2", pin: "K1", name: "spi1_sdio2_p0_24"},
          { signal: "SDIO3", pin: "L1", name: "spi1_sdio3_p0_25"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "15000000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { zephyr: "timer0", datamodel: "TMR0", enable: "TMR0_ENABLE", clock_mux : "TMR0a_MUX", clock_default : "PCLK",
      pins: [
          { signal: "IOBN", pin: "B2", name: "tmr0b_iobn_p0_5"},
          { signal: "IOA", pin: "E11", name: "tmr0a_ioa_p0_2"},
          { signal: "IOA", pin: "E2", name: "tmr0b_ioa_p0_8"},
          { signal: "IOB", pin: "F2", name: "tmr0b_iob_p0_9"},
          { signal: "IOAN", pin: "H4", name: "tmr0b_ioan_p0_4"}
      ],
      subnode: () => getAssignedPeripheral("TMR0").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR0").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { zephyr: "timer1", datamodel: "TMR1", enable: "TMR1_ENABLE", clock_mux : "TMR1a_MUX", clock_default : "PCLK",
      pins: [
          { signal: "IOB", pin: "G10", name: "tmr1a_iob_p0_15"},
          { signal: "IOA", pin: "G11", name: "tmr1a_ioa_p0_14"},
          { signal: "IOAN", pin: "J3", name: "tmr1b_ioan_p0_12"},
          { signal: "IOBN", pin: "K3", name: "tmr1b_iobn_p0_13"}
      ],
      subnode: () => getAssignedPeripheral("TMR1").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR1").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { zephyr: "timer2", datamodel: "TMR2", enable: "TMR2_ENABLE", clock_mux : "TMR2a_MUX", clock_default : "PCLK",
      pins: [
          { signal: "IOA", pin: "M5", name: "tmr2_ioa_p0_26"},
          { signal: "IOB", pin: "N5", name: "tmr2_iob_p0_27"}
      ],
      subnode: () => getAssignedPeripheral("TMR2").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR2").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { zephyr: "timer3", datamodel: "TMR3", enable: "TMR3_ENABLE", clock_mux : "TMR3a_MUX", clock_default : "PCLK",
      pins: [
          { signal: "IOA", pin: "K8", name: "tmr3a_ioa_p1_6"},
          { signal: "IOB", pin: "L8", name: "tmr3a_iob_p1_7"},
          { signal: "IOA", pin: "M4", name: "tmr3b_ioa_p1_4"},
          { signal: "IOB", pin: "N4", name: "tmr3b_iob_p1_5"}
      ],
      subnode: () => getAssignedPeripheral("TMR3").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR3").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { zephyr: "trng", datamodel: "TRNG", enable: "TRNG_ENABLE"},
    { zephyr: "uart0", datamodel: "UART0", enable: "UART0_ENABLE", clock_mux: "UART0_MUX", clock_default: "PCLK",
      pins: [
          { signal: "RTS", pin: "E10", name: "uart0b_rts_p0_3"},
          { signal: "CTS", pin: "E11", name: "uart0b_cts_p0_2"},
          { signal: "RX", pin: "K6", name: "uart0a_rx_p0_0"},
          { signal: "TX", pin: "L6", name: "uart0a_tx_p0_1"}
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
    { zephyr: "uart1", datamodel: "UART1", enable: "UART1_ENABLE", clock_mux: "UART1_MUX", clock_default: "PCLK",
      pins: [
          { signal: "RX", pin: "J3", name: "uart1_rx_p0_12"},
          { signal: "TX", pin: "K3", name: "uart1_tx_p0_13"}
      ],
      config: [
          { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200" },
          { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
            value: x => (x === "DISABLED" ? "none" : (x === "EVEN" ? "even" : "odd"))},
          { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
            value: x => (x === "1" ? "1" : (getAssignedPeripheral("UART1").Config?.CHAR_SIZE === "5" ? "1_5" : "2"))},
          { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5"}
      ]},
    { zephyr: "uart2", datamodel: "UART2", enable: "UART2_ENABLE", clock_mux: "UART2_MUX", clock_default: "PCLK",
      pins: [
          { signal: "RX", pin: "K2", name: "uart2_rx_p1_0"},
          { signal: "TX", pin: "L2", name: "uart2_tx_p1_1"}
      ],
      config: [
          { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200" },
          { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
            value: x => (x === "DISABLED" ? "none" : (x === "EVEN" ? "even" : "odd"))},
          { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
            value: x => (x === "1" ? "1" : (getAssignedPeripheral("UART2").Config?.CHAR_SIZE === "5" ? "1_5" : "2"))},
          { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5"}
      ]},
    { zephyr: "uart3", datamodel: "LPUART0", enable: "ENABLE", clock_mux : "MUX", clock_default : "IBRO",
      pins: [
          { signal: "TX", pin: "C3", name: "lpuartb_tx_p2_7"},
          { signal: "RX", pin: "D3", name: "lpuartb_rx_p2_6"}
      ],
      config: [
          { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200" },
          { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
            value: x => (x === "DISABLED" ? "none" : (x === "EVEN" ? "even" : "odd"))},
          { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
            value: x => (x === "1" ? "1" : (getAssignedPeripheral("LPUART0").Config?.CHAR_SIZE === "5" ? "1_5" : "2"))},
          { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5"}
      ]},
    { zephyr: "wdt0", datamodel: "WDT0", enable: "ENABLE", clock_mux: "MUX", clock_default: "PCLK"},
    { zephyr: "wdt1", datamodel: "LPWDT0", enable: "ENABLE", clock_mux: "MUX", clock_default: "IBRO"}
];

unsupported_in_dts = [
  {datamodel: "AES", diag: "The Advanced Encryption Standard is not currently supported in devicetree.", ctrl: "AES_ENABLE", value: "TRUE"},
  {datamodel: "CNN", diag: "The Convolutional Neural Network peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
  {datamodel: "CNN", clocknode: "CNN Mux", diag: "The Convolutional Neural Network peripheral is not currently supported in devicetree.", ctrl: "MUX", value: "SYS_CLK"},
  {datamodel: "CNN", clocknode: "CNN PRESCALER", diag: "The Convolutional Neural Network peripheral is not currently supported in devicetree.", ctrl: "DIV", value: "2"},
  {datamodel: "CRC", diag: "The Cyclic Redundancy Check peripheral is not currently supported in devicetree.", ctrl: "CRC_ENABLE", value: "TRUE"},
  {datamodel: "CSI2", diag: "The Camera Interface peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
  {datamodel: "I2S0", diag: "The Inter-IC Sound Interface peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
  {datamodel: "LPCMP", diag: "The Low-Power Comparator peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
  {datamodel: "PCIF", diag: "The Parallel Camera Interface peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
  {datamodel: "PT0", diag: "The Pulse Train Engine 0 peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
  {datamodel: "PT1", diag: "The Pulse Train Engine 1 peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
  {datamodel: "PT2", diag: "The Pulse Train Engine 2 peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
  {datamodel: "PT3", diag: "The Pulse Train Engine 3 peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
  {datamodel: "PTG", diag: "The Pulse Train Engines peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
  {datamodel: "SDHC", diag: "The Secure Digital Host Controller peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
  {datamodel: "SEMA", diag: "The Semaphore peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
  {datamodel: "SIMO", diag: "The Single Inductor Multiple Output Power Supply peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
  {datamodel: "USBHS", clocknode: "High-Speed USB", diag: "The High-Speed USB peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
  {datamodel: "USBHS", clocknode: "High-Speed USB DIV", diag: "The High-Speed USB peripheral is not currently supported in devicetree.", ctrl: "DIV", value: "10"},
  {datamodel: "WUT", diag: "The Wake-Up Timer peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
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
    } else if (clock === "ERFO") {
        return "ebo";
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
    clocksUsed.add(mapClockName(getClockSetting("SYS_OSC Mux", "MUX", "IPO")));
    return Array.from(clocksUsed).sort();
}
