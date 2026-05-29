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

if (it.cfsconfig.Package.toUpperCase() === "TQFN24") {

peripheralData = [
    { zephyr: "dma0", datamodel: "DMA", enable: "ENABLE"},
    { zephyr: "flc0", datamodel: "FLC", enable: "ENABLE"},
    { zephyr: "i2c0", datamodel: "I2C0", enable: "I2C0_ENABLE",
      pins: [
          { signal: "SDA", pin: "13", name: "i2c0_sda_p0_9"},
          { signal: "SCL", pin: "14", name: "i2c0_scl_p0_8"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { zephyr: "i2c1", datamodel: "I2C1", enable: "I2C1_ENABLE",
      pins: [
          { signal: "SDA", pin: "23", name: "i2c1_sda_p0_3"},
          { signal: "SCL", pin: "24", name: "i2c1_scl_p0_2"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { zephyr: "rtc_counter", datamodel: "RTC"},
    { zephyr: "spi0", datamodel: "SPI0", enable: "ENABLE",
      pins: [
          { signal: "CS0", pin: "18", name: "spi0_ss0_p0_7"},
          { signal: "SCK", pin: "19", name: "spi0_sck_p0_6"},
          { signal: "MOSI", pin: "20", name: "spi0_mosi_p0_5"},
          { signal: "MISO", pin: "21", name: "spi0_miso_p0_4"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "15000000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { zephyr: "timer0", datamodel: "TMR0", enable: "TMR0_ENABLE",
      pins: [
          { signal: "IOA", pin: "23", name: "tmr0_p0_3"}
      ],
      subnode: () => getAssignedPeripheral("TMR0").Config?.MODE === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR0").Config?.MODE === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV", cfg_default: "1"}
      ]},
    { zephyr: "timer1", datamodel: "TMR1", enable: "TMR1_ENABLE",
      subnode: () => getAssignedPeripheral("TMR1").Config?.MODE === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR1").Config?.MODE === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV", cfg_default: "1"}
      ]},
    { zephyr: "timer2", datamodel: "TMR2", enable: "TMR2_ENABLE",
      subnode: () => getAssignedPeripheral("TMR2").Config?.MODE === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR2").Config?.MODE === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV", cfg_default: "1"}
      ]},
    { zephyr: "uart0", datamodel: "UART0", enable: "UART0_ENABLE",
      pins: [
          { signal: "RTS", pin: "18", name: "uart0_rts_p0_7"},
          { signal: "CTS", pin: "19", name: "uart0_cts_p0_6"},
          { signal: "RX", pin: "20", name: "uart0_rx_p0_5"},
          { signal: "TX", pin: "21", name: "uart0_tx_p0_4"}
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
    { zephyr: "uart1", datamodel: "UART1", enable: "UART1_ENABLE",
      pins: [
          { signal: "RX", pin: "1", name: "uart1_rx_p0_1"},
          { signal: "RX", pin: "16", name: "uart1_rx_p0_11"},
          { signal: "TX", pin: "17", name: "uart1_tx_p0_10"},
          { signal: "RX", pin: "18", name: "uart1_rx_p0_7"},
          { signal: "TX", pin: "19", name: "uart1_tx_p0_6"},
          { signal: "TX", pin: "2", name: "uart1_tx_p0_0"},
          { signal: "RTS", pin: "4", name: "uart1_rts_p0_13"},
          { signal: "CTS", pin: "5", name: "uart1_cts_p0_12"}
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
    { zephyr: "wdt0", datamodel: "WDT0"}
];

} else if (it.cfsconfig.Package.toUpperCase() === "TQFN20") {

peripheralData = [
    { zephyr: "dma0", datamodel: "DMA", enable: "ENABLE"},
    { zephyr: "flc0", datamodel: "FLC", enable: "ENABLE"},
    { zephyr: "i2c0", datamodel: "I2C0", enable: "I2C0_ENABLE",
      pins: [
          { signal: "SDA", pin: "11", name: "i2c0_sda_p0_9"},
          { signal: "SCL", pin: "12", name: "i2c0_scl_p0_8"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { zephyr: "i2c1", datamodel: "I2C1", enable: "I2C1_ENABLE",
      pins: [
          { signal: "SDA", pin: "19", name: "i2c1_sda_p0_3"},
          { signal: "SCL", pin: "20", name: "i2c1_scl_p0_2"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { zephyr: "rtc_counter", datamodel: "RTC"},
    { zephyr: "spi0", datamodel: "SPI0", enable: "ENABLE",
      pins: [
          { signal: "CS0", pin: "15", name: "spi0_ss0_p0_7"},
          { signal: "SCK", pin: "16", name: "spi0_sck_p0_6"},
          { signal: "MOSI", pin: "17", name: "spi0_mosi_p0_5"},
          { signal: "MISO", pin: "18", name: "spi0_miso_p0_4"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "15000000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { zephyr: "timer0", datamodel: "TMR0", enable: "TMR0_ENABLE",
      pins: [
          { signal: "IOA", pin: "19", name: "tmr0_p0_3"}
      ],
      subnode: () => getAssignedPeripheral("TMR0").Config?.MODE === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR0").Config?.MODE === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV", cfg_default: "1"}
      ]},
    { zephyr: "timer1", datamodel: "TMR1", enable: "TMR1_ENABLE",
      subnode: () => getAssignedPeripheral("TMR1").Config?.MODE === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR1").Config?.MODE === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV", cfg_default: "1"}
      ]},
    { zephyr: "timer2", datamodel: "TMR2", enable: "TMR2_ENABLE",
      subnode: () => getAssignedPeripheral("TMR2").Config?.MODE === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR2").Config?.MODE === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV", cfg_default: "1"}
      ]},
    { zephyr: "uart0", datamodel: "UART0", enable: "UART0_ENABLE",
      pins: [
          { signal: "RTS", pin: "15", name: "uart0_rts_p0_7"},
          { signal: "CTS", pin: "16", name: "uart0_cts_p0_6"},
          { signal: "RX", pin: "17", name: "uart0_rx_p0_5"},
          { signal: "TX", pin: "18", name: "uart0_tx_p0_4"}
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
    { zephyr: "uart1", datamodel: "UART1", enable: "UART1_ENABLE",
      pins: [
          { signal: "RX", pin: "1", name: "uart1_rx_p0_1"},
          { signal: "RX", pin: "13", name: "uart1_rx_p0_11"},
          { signal: "TX", pin: "14", name: "uart1_tx_p0_10"},
          { signal: "RX", pin: "15", name: "uart1_rx_p0_7"},
          { signal: "TX", pin: "16", name: "uart1_tx_p0_6"},
          { signal: "TX", pin: "2", name: "uart1_tx_p0_0"},
          { signal: "RTS", pin: "3", name: "uart1_rts_p0_13"},
          { signal: "CTS", pin: "4", name: "uart1_cts_p0_12"}
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
    { zephyr: "wdt0", datamodel: "WDT0"}
];

} else if (it.cfsconfig.Package.toUpperCase() === "WLP") {

peripheralData = [
    { zephyr: "dma0", datamodel: "DMA", enable: "ENABLE"},
    { zephyr: "flc0", datamodel: "FLC", enable: "ENABLE"},
    { zephyr: "i2c0", datamodel: "I2C0", enable: "I2C0_ENABLE",
      pins: [
          { signal: "SDA", pin: "B3", name: "i2c0_sda_p0_9"},
          { signal: "SCL", pin: "B4", name: "i2c0_scl_p0_8"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { zephyr: "i2c1", datamodel: "I2C1", enable: "I2C1_ENABLE",
      pins: [
          { signal: "SCL", pin: "D1", name: "i2c1_scl_p0_2"},
          { signal: "SDA", pin: "D2", name: "i2c1_sda_p0_3"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "100000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { zephyr: "rtc_counter", datamodel: "RTC"},
    { zephyr: "spi0", datamodel: "SPI0", enable: "ENABLE",
      pins: [
          { signal: "SCK", pin: "C3", name: "spi0_sck_p0_6"},
          { signal: "CS0", pin: "C4", name: "spi0_ss0_p0_7"},
          { signal: "MISO", pin: "D3", name: "spi0_miso_p0_4"},
          { signal: "MOSI", pin: "D4", name: "spi0_mosi_p0_5"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "15000000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { zephyr: "timer0", datamodel: "TMR0", enable: "TMR0_ENABLE",
      pins: [
          { signal: "IOA", pin: "D2", name: "tmr0_p0_3"}
      ],
      subnode: () => getAssignedPeripheral("TMR0").Config?.MODE === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR0").Config?.MODE === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV", cfg_default: "1"}
      ]},
    { zephyr: "timer1", datamodel: "TMR1", enable: "TMR1_ENABLE",
      subnode: () => getAssignedPeripheral("TMR1").Config?.MODE === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR1").Config?.MODE === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV", cfg_default: "1"}
      ]},
    { zephyr: "timer2", datamodel: "TMR2", enable: "TMR2_ENABLE",
      subnode: () => getAssignedPeripheral("TMR2").Config?.MODE === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR2").Config?.MODE === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV", cfg_default: "1"}
      ]},
    { zephyr: "uart0", datamodel: "UART0", enable: "UART0_ENABLE",
      pins: [
          { signal: "CTS", pin: "C3", name: "uart0_cts_p0_6"},
          { signal: "RTS", pin: "C4", name: "uart0_rts_p0_7"},
          { signal: "TX", pin: "D3", name: "uart0_tx_p0_4"},
          { signal: "RX", pin: "D4", name: "uart0_rx_p0_5"}
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
    { zephyr: "uart1", datamodel: "UART1", enable: "UART1_ENABLE",
      pins: [
          { signal: "TX", pin: "C1", name: "uart1_tx_p0_0"},
          { signal: "RX", pin: "C2", name: "uart1_rx_p0_1"},
          { signal: "TX", pin: "C3", name: "uart1_tx_p0_6"},
          { signal: "RX", pin: "C4", name: "uart1_rx_p0_7"}
      ],
      config: [
          { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200"},
          { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
            value: x => (x === "DISABLED" ? "none" : x.toLowerCase()) },
          { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
            value: x => (x === "1" ? "1" : (getAssignedPeripheral("UART1").Config?.CHAR_SIZE === "5" ? "1_5" : "2"))},
          { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5"}
      ]},
    { zephyr: "wdt0", datamodel: "WDT0"}
];

}

unsupported_in_dts = [
    {clocknode: "ERTCO Mux", diag: "Bypass of the ERTCO is not currently supported in devicetree.", ctrl: "MUX", value: "ERTCO_CLK"},
    {datamodel: "ICC", diag: "The Instruction Cache Controller peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"},
    {datamodel: "RTC", clocknode: "32KCAL", diag: "Enabling 32KCAL from the RTC is not currently supported in devicetree.", ctrl: "32KCAL", value: "1HZ"},
    {datamodel: "RTC", clocknode: "32KCAL", diag: "Enabling 32KCAL from the RTC is not currently supported in devicetree.", ctrl: "32KCAL", value: "512HZ"},
    {datamodel: "RTC", clocknode: "32KCAL", diag: "Enabling 32KCAL from the RTC is not currently supported in devicetree.", ctrl: "32KCAL", value: "4KHZ"},
    {datamodel: "RTC", clocknode: "32KCAL", diag: "Enabling 32KCAL from the RTC is not currently supported in devicetree.", ctrl: "32KCAL", value: "32KHZ"},
    {datamodel: "SPIMSS", diag: "The SPIMSS peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE"}
];

function mapClockName(clock) {
    if (clock === "HFIO") {
        return "ipo";
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
