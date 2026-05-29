
peripheralData = [
    { zephyr: "dma0", datamodel: "DMA", enable: "ENABLE"},
    { zephyr: "flc0", datamodel: "FLC0"},
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
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { zephyr: "i2c2", datamodel: "I2C2", enable: "I2C2_ENABLE",
      pins: [
          { signal: "SCL", pin: "64", name: "i2c2a_scl_p0_18"},
          { signal: "SDA", pin: "65", name: "i2c2a_sda_p0_19"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { zephyr: "lptimer0", datamodel: "LPTMR0", enable: "LPTMR0_ENABLE", clock_mux: "LPTMR0_MUX", clock_default: "AOD_CLK",
      pins: [
          { signal: "IA", pin: "12", name: "lptmr0b_ia_p0_6"},
          { signal: "OA", pin: "13", name: "lptmr0b_oa_p0_7"}
      ],
      subnode: () => getAssignedPeripheral("LPTMR0").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      subnode_boilerplate: () => getAssignedPeripheral("LPTMR0").Config?.MODE_A === "COMPARE" ? ['compatible = "adi,max32-counter"'] : ['compatible = "adi,max32-pwm"', '#pwm-cells = <3>'],
      pins_node: () => getAssignedPeripheral("LPTMR0").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { zephyr: "spi1", datamodel: "SPI1", enable: "SPI1_ENABLE",
      pins: [
          { signal: "SCK", pin: "43", name: "spi1a_sck_p0_16"},
          { signal: "MOSI", pin: "44", name: "spi1a_mosi_p0_15"},
          { signal: "MISO", pin: "45", name: "spi1a_miso_p0_14"},
          { signal: "CS0", pin: "59", name: "spi1d_ss0_p0_13"},
          { signal: "CS0", pin: "63", name: "spi1a_ss0_p0_17"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "15000000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { zephyr: "timer0", datamodel: "TMR0", enable: "TMR0_ENABLE", clock_mux: "TMR0a_MUX",  clock_default: "PCLK",
      pins: [
          { signal: "OA", pin: "11", name: "tmr0c_oa_p0_1"},
          { signal: "IA", pin: "43", name: "tmr0c_ia_p0_16"},
          { signal: "IA", pin: "55", name: "tmr0c_ia_p0_8"},
          { signal: "OA", pin: "56", name: "tmr0c_oa_p0_9"},
          { signal: "OA", pin: "63", name: "tmr0c_oa_p0_17"},
          { signal: "IA", pin: "9", name: "tmr0c_ia_p0_0"}
      ],
      subnode: () => getAssignedPeripheral("TMR0").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR0").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { zephyr: "timer1", datamodel: "TMR1", enable: "TMR1_ENABLE", clock_mux: "TMR1a_MUX",  clock_default: "PCLK",
      pins: [
          { signal: "IA", pin: "64", name: "tmr1c_ia_p0_18"},
          { signal: "OA", pin: "65", name: "tmr1c_oa_p0_19"}
      ],
      subnode: () => getAssignedPeripheral("TMR1").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR1").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { zephyr: "timer2", datamodel: "TMR2", enable: "TMR2_ENABLE", clock_mux: "TMR2a_MUX",  clock_default: "PCLK",
      pins: [
          { signal: "OA", pin: "59", name: "tmr2c_oa_p0_13"},
          { signal: "OA", pin: "8", name: "tmr2c_oa_p0_21"}
      ],
      subnode: () => getAssignedPeripheral("TMR2").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR2").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { zephyr: "timer3", datamodel: "TMR3", enable: "TMR3_ENABLE", clock_mux: "TMR3a_MUX",  clock_default: "PCLK",
      pins: [
          { signal: "IA", pin: "12", name: "tmr3c_ia_p0_6"},
          { signal: "OA", pin: "13", name: "tmr3c_oa_p0_7"},
          { signal: "OA", pin: "44", name: "tmr3c_oa_p0_15"},
          { signal: "IA", pin: "45", name: "tmr3c_ia_p0_14"},
          { signal: "OA", pin: "66", name: "tmr3c_oa_p0_31"}
      ],
      subnode: () => getAssignedPeripheral("TMR3").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR3").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { zephyr: "uart0", datamodel: "UART0", enable: "UART0_ENABLE", clock_mux: "UART0_MUX",  clock_default: "PCLK",
      pins: [
          { signal: "RX", pin: "55", name: "uart0a_rx_p0_8"},
          { signal: "TX", pin: "56", name: "uart0a_tx_p0_9"}
      ],
      config: [
          { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200"},
          { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
            value: x => (x === "DISABLED" ? "none" : x.toLowerCase()) },
          { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
            value: x => (x === "1" ? "1" : (getAssignedPeripheral("UART0").Config?.CHAR_SIZE === "5" ? "1_5" : "2"))},
          { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5"}
      ]},
    { zephyr: "uart2", datamodel: "UART2", enable: "UART2_ENABLE", clock_mux: "UART2_MUX",  clock_default: "PCLK",
      pins: [
          { signal: "RTS", pin: "4", name: "uart2a_rts_p1_11"},
          { signal: "CTS", pin: "43", name: "uart2b_cts_p0_16"},
          { signal: "TX", pin: "44", name: "uart2b_tx_p0_15"},
          { signal: "RX", pin: "45", name: "uart2b_rx_p0_14"},
          { signal: "RTS", pin: "46", name: "uart2b_rts_p1_8"},
          { signal: "RX", pin: "46", name: "uart2a_rx_p1_8"},
          { signal: "CTS", pin: "5", name: "uart2a_cts_p1_10"},
          { signal: "TX", pin: "6", name: "uart2a_tx_p1_9"},
          { signal: "RTS", pin: "63", name: "uart2b_rts_p0_17"}
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
    { zephyr: "wdt0", datamodel: "WDT0", enable: "WDT0_ENABLE", clock_mux: "WDT0_MUX",  clock_default: "PCLK",}
];

unsupported_in_dts = [
    {datamodel: "AES", diag: "The AES peripheral is not currently supported in devicetree.", ctrl: "AES_ENABLE", value: "TRUE"},
    {clocknode: "AFE", diag: "The AFE is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {clocknode: "AOD_CLK", diag: "Setting divide value on AOD from the GCR is not currently supported in devicetree.", ctrl: "DIV", value: "8" },
    {clocknode: "AOD_CLK", diag: "Setting divide value on AOD from the GCR is not currently supported in devicetree.", ctrl: "DIV", value: "16" },
    {clocknode: "AOD_CLK", diag: "Setting divide value on AOD from the GCR is not currently supported in devicetree.", ctrl: "DIV", value: "32" },
    {datamodel: "CRC", diag: "The CRC peripheral is not currently supported in devicetree.", ctrl: "CRC_ENABLE", value: "TRUE"},
    {clocknode: "ERFO Mux", diag: "Bypass of the ERFO is not currently supported in devicetree.", ctrl: "MUX", value: "ERFO_CLK"},
    {clocknode: "HART_CLK Mux", diag: "Setting clock option on HART Mux is not currently supported in devicetree.", ctrl: "MUX", value: "ERFO_DIV_8"},
    {clocknode: "IPO PRESCALER", diag: "Setting divide value on IPO PRESCALER from the GCR is not currently supported in devicetree.", ctrl: "DIV", value: "2"},
    {clocknode: "IPO PRESCALER", diag: "Setting divide value on IPO PRESCALER from the GCR is not currently supported in devicetree.", ctrl: "DIV", value: "4"},
    {clocknode: "IPO PRESCALER", diag: "Setting divide value on IPO PRESCALER from the GCR is not currently supported in devicetree.", ctrl: "DIV", value: "8"},
    {datamodel: "LPTMR1", diag: "The Low-Power Timer 1 peripheral is not currently supported in devicetree.", ctrl: "LPTMR1_ENABLE", value: "TRUE", MUX: "LPTMR1_MUX"},
    {datamodel: "LPUART0", diag: "The Low-Power UART peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE", MUX: "MUX"},
    {datamodel: "SPI0", diag: "The Serial Peripheral Interface 0 is not currently supported in devicetree.", ctrl: "SPI0_ENABLE", value: "TRUE"},
    {datamodel: "SPI2", diag: "The Serial Peripheral Interface 2 is not currently supported in devicetree.", ctrl: "SPI2_ENABLE", value: "TRUE"},
    {datamodel: "UART1", diag: "The UART1 peripheral is not currently supported in devicetree.", enable: "UART1_ENABLE", clock_mux: "UART1_MUX"},
    {datamodel: "WDT1", diag: "The Watch Dog Timer 1 peripheral is not currently supported in devicetree.", ctrl: "WDT1_ENABLE", value: "TRUE", MUX: "WDT1_MUX"}
];

function mapClockName(clock) {
    if (clock === "EXT_CLK1" || clock === "EXT_CLK2") {
        return "extclk";
    } else if (clock === "IPO PRESCALER") {
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
    clocksUsed.add(mapClockName(getClockSetting("SYS_OSC Mux", "MUX", "IPO PRESCALER")));
    return Array.from(clocksUsed).sort();
}
