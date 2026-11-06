/**
 * Copyright (c) 2026 Analog Devices, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Shared helper functions for SSDD peripheral configuration
 */

// Get the value of an integer config option as an integer
function getPeriConfigValueInt(instance, controlId, defaultValue) {
  const rawValue = getPeriConfigValue(instance, controlId, defaultValue);
  return Number(rawValue);
}

// Get the value of a hexadecimal config option as a hex
function getPeriConfigValueHex(instance, controlId, defaultValue) {
  return getPeriConfigValue(instance, controlId, defaultValue);
}

// Get the value of a boolean config option as an integer
function getPeriConfigValueBoolAsInt(instance, controlId, defaultValue) {
  const rawValue = getPeriConfigValue(instance, controlId, defaultValue);
  return rawValue === "TRUE" ? 1 : 0;
}

// Get the value of a boolean config option
function getPeriConfigValueBool(instance, controlId, defaultValue) {
  const rawValue = getPeriConfigValue(instance, controlId, defaultValue);
  return rawValue.toLowerCase() == "true";
}

// Get the value of an enum config option as an integer
function getPeriConfigValueEnum(instance, controlId, defaultValue, idMap) {
  const rawValue = getPeriConfigValue(instance, controlId, defaultValue);
  return idMap[rawValue];
}

// Peripheral name prefixes checked via anyInstanceAssigned() when selecting
// SSDD driver/service sources in config.mk.eta.
const SSDD_PERIPHERAL_PREFIXES = [
  "ASRC",
  "CANFD",
  "CRC",
  "EMAC",
  "EMSI",
  "FIR",
  "HADC",
  "HSM",
  "IIR",
  "LP",
  "MLB",
  "PKA",
  "PKTE",
  "CNT",
  "SPDIF",
  "SPI",
  "SPORT",
  "TMU",
  "TRNG",
  "TWI",
  "UART",
  "XSPI",
  "DAI",
  "DMA",
  "DMCPM",
  "EMDMA",
  "FRACNPLL",
  "L2CTL",
  "MEPU",
  "PCG",
  "PDM",
  "PDMA",
  "PKIC",
  "PWM",
  "PWR",
  "RCU",
  "SMPU",
  "SPU",
  "SWU",
  "TIMER",
  "TRU",
  "WDOG"
];

// Is any peripheral eligible for SSDD driver/service source generation assigned
// to this project?
function anySsddPeripheralAssigned(
  isInstanceAssigned = anyInstanceAssigned
) {
  return (
    isInstanceAssigned("PORT", "", true) ||
    SSDD_PERIPHERAL_PREFIXES.some((prefix) =>
      isInstanceAssigned(prefix)
    )
  );
}
