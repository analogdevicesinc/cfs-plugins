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
    { datamodel: "DMA0", enable: "ENABLE", zephyr: "dma0" },
    { datamodel: "DMA1", enable: "ENABLE", zephyr: "dma1" },
    { datamodel: "I3C0", enable: "ENABLE", zephyr: "i3c0",
      pins: [
          { signal: "SCL", pin: "A1", name: "i3c_scl_p0_0"},
          { signal: "SDA", pin: "A2", name: "i3c_sda_p0_1"},
          { signal: "PUR", pin: "B6", name: "i3c_pur_p0_8"}
      ]},
    { datamodel: "RTC", zephyr: "rtc_counter", clocknode: "CLK_32KHZ Mux", clock_mux: "MUX", clock_default: "INRO_DIV_4" },
    { datamodel: "SPI0", enable: "ENABLE", zephyr: "spi0",
      pins: [
          { signal: "MOSI", pin: "A4", name: "spi0_mosi_p0_2"},
          { signal: "CS0", pin: "A5", name: "spi0_ss0_p0_3"},
          { signal: "MISO", pin: "A6", name: "spi0_miso_p0_4"},
          { signal: "SCK", pin: "B4", name: "spi0_sck_p0_6"},
          { signal: "CS1", pin: "B5", name: "spi0_ss1_p0_7"},
          { signal: "CS2", pin: "B6", name: "spi0_ss2_p0_8"}
      ],
      config: [
          { name: "clock-frequency", type: "int", control: "FREQ", cfg_default: "25000000",
            value: x => convertToUnitsMacro(x, "FREQ", 1000)}
      ]},
    { datamodel: "TMR0", enable: "TMR0_ENABLE", zephyr: "timer0", clock_mux: "TMR0_MUX", clock_default: "PCLK",
      pins: [
          { signal: "O", pin: "A1", name: "tmr0a_p0_0"},
          { signal: "O", pin: "C3", name: "tmr0b_p0_5"}
      ],
      subnode: () => getAssignedPeripheral("TMR0").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR0").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { datamodel: "TMR1", enable: "TMR1_ENABLE", zephyr: "timer1", clock_mux: "TMR1_MUX", clock_default: "PCLK",
      pins: [
          { signal: "O", pin: "A2", name: "tmr1a_p0_1"},
          { signal: "O", pin: "B2", name: "tmr1b_p0_9"}
      ],
      subnode: () => getAssignedPeripheral("TMR1").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR1").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { datamodel: "TMR2", enable: "TMR2_ENABLE", zephyr: "timer2", clock_mux: "TMR2_MUX", clock_default: "PCLK",
      pins: [
          { signal: "O", pin: "A3", name: "tmr2a_p0_10"}
      ],
      subnode: () => getAssignedPeripheral("TMR2").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR2").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { datamodel: "TMR3", enable: "TMR3_ENABLE", zephyr: "timer3", clock_mux: "TMR3_MUX", clock_default: "PCLK",
      pins: [
          { signal: "O", pin: "A4", name: "tmr3a_p0_2"},
          { signal: "O", pin: "B5", name: "tmr3b_p0_7"}
      ],
      subnode: () => getAssignedPeripheral("TMR3").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR3").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { datamodel: "TMR4", enable: "TMR4_ENABLE", zephyr: "timer4", clock_mux: "TMR4_MUX", clock_default: "PCLK",
      pins: [
          { signal: "O", pin: "A5", name: "tmr4a_p0_3"},
          { signal: "O", pin: "B4", name: "tmr4b_p0_6"}
      ],
      subnode: () => getAssignedPeripheral("TMR4").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR4").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { datamodel: "TMR5", enable: "TMR5_ENABLE", zephyr: "timer5", clock_mux: "TMR5_MUX", clock_default: "PCLK",
      pins: [
          { signal: "O", pin: "A6", name: "tmr5a_p0_4"},
          { signal: "O", pin: "B3", name: "tmr5b_p0_11"}
      ],
      subnode: () => getAssignedPeripheral("TMR5").Config?.MODE_A === "COMPARE" ? "counter" : "pwm",
      pins_node: () => getAssignedPeripheral("TMR5").Config?.MODE_A === "COMPARE" ? undefined : "subnode",
      config: [
          { name: "prescaler", type: "int", control: "CLKDIV_A", cfg_default: "1"}
      ]},
    { datamodel: "TRNG", enable: "ENABLE", zephyr: "trng" },
    { datamodel: "UART0", enable: "ENABLE", zephyr: "uart0", clock_mux: "MUX", clock_default: "PCLK",
      pins: [
          { signal: "TX", pin: "B2", name: "uart0_tx_p0_9"},
          { signal: "RX", pin: "C3", name: "uart0_rx_p0_5"}
      ],
      config: [
          { name: "current-speed", type: "int", control: "BAUD", cfg_default: "115200" },
          { name: "hw-flow-control", type: "boolean", control: "HW_FLOW_CTRL", cfg_default: "DISABLED",
            value: x => x !== "DISABLED"},
          { name: "parity", type: "string", control: "PARITY", cfg_default: "DISABLED",
            value: x => (x === "DISABLED" ? "none" : (x === "EVEN" ? "even" : "odd"))},
          { name: "stop-bits", type: "string", control: "STOP_BITS", cfg_default: "1",
            value: x => (x === "1" ? "1" : getAssignedPeripheral("UART0").Config?.CHAR_SIZE === "5" ? "1_5" : "2")},
          { name: "data-bits", type: "int", control: "CHAR_SIZE", cfg_default: "5"}
      ]},
    { datamodel: "WDT", enable: "ENABLE", zephyr: "wdt0", clock_mux: "MUX", clock_default: "PCLK" },
    { datamodel: "WUT0", zephyr: "wut0", clocknode: "CLK_32KHZ Mux", clock_mux: "MUX", clock_default: "INRO_DIV_4" },
    { datamodel: "WUT1", zephyr: "wut1", clocknode: "CLK_32KHZ Mux", clock_mux: "MUX", clock_default: "INRO_DIV_4" }
];

unsupported_in_dts = [
    { clocknode: "ERFO Mux", diag: "Bypass of the ERFO is not currently supported in devicetree.", ctrl: "MUX", value: "ERFO_CLK" },
    { clocknode: "ERTCO Mux", diag: "Bypass of the ERTCO is not currently supported in devicetree.", ctrl: "MUX", value: "ERTCO_CLK" },
    { datamodel: "RTC", clocknode: "SQWOUT Mux", diag: "Enabling SQWOUT from the RTC is not currently supported in devicetree.", ctrl: "SQWOUT Mux", value: "CLK_4KHZ" },
    { datamodel: "RTC", clocknode: "SQWOUT Mux", diag: "Enabling SQWOUT from the RTC is not currently supported in devicetree.", ctrl: "SQWOUT Mux", value: "RTC_DIV_8" },
    { datamodel: "RTC", clocknode: "SQWOUT Mux", diag: "Enabling SQWOUT from the RTC is not currently supported in devicetree.", ctrl: "SQWOUT Mux", value: "RTC_DIV_4096" },
    { datamodel: "AES", diag: "The Advanced Encryption Standard peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE" },
    { datamodel: "BLE", diag: "The Bluetooth Low Energy peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE" },
    { datamodel: "CRC", diag: "The Cyclic Redundancy Check peripheral is not currently supported in devicetree.", ctrl: "ENABLE", value: "TRUE" }
];

function mapClockName(clock) {
    if (clock === "CLK_EXT") {
        return "extclk";
    } else if (clock === "INRO_DIV_4") {
        return "inro";
    } else if (clock === "PCLK") {
        return undefined;
    } else if (clock === "CLK_32KHZ") {
        return mapClockName(getClockSetting("CLK_32KHZ Mux", "MUX", "INRO_DIV_4"));
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
    let sysclk = getClockSetting("SYS_OSC Mux", "MUX", "IPO");
    if (sysclk === "CLK_32KHZ") {
        // We add ERTCO, because until the WUT changes the clock source,
        // we will be using ERTCO.
        clocksUsed.add("ertco");
    }
    clocksUsed.add(mapClockName(sysclk));
    return Array.from(clocksUsed).sort();
}
