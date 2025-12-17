/**
 * Copyright (c) 2025 Analog Devices, Inc.
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
 * Shared helper functions for I2S peripheral configuration
 */

// Return the length of the buffer
function getI2SBufferLength() {
  return getPeriConfigValue(it.instance, "LENGTH", "256");
}

// Return whether the TX mode is enabled
function getI2STxEnable() {
  return getPeriConfigValue(it.instance, "TX_RX_MODE", "TX_RX") !== "RX_ONLY";
}

// Return whether the RX mode is enabled
function getI2SRxEnable() {
  return getPeriConfigValue(it.instance, "TX_RX_MODE", "TX_RX") !== "TX_ONLY";
}

// Return the TX buffer name
function getI2STxBufferName() {
  return getPeriConfigValue(it.instance, "TX_BUFFER_NAME", it.instance.toLowerCase() + "_tx_buffer");
}

// Return the raw data buffer name
function getI2SRawDataBufferName() {
  return getPeriConfigValue(it.instance, "RAW_DATA_BUFFER_NAME", it.instance.toLowerCase() + "_raw_data_buffer");
}

// Return the RX buffer name
function getI2SRxBufferName() {
  return getPeriConfigValue(it.instance, "RX_BUFFER_NAME", it.instance.toLowerCase() + "_rx_buffer");
}


// Check if there are duplicate buffer names
function hasDuplicateI2SBufferNames() {
  const bufferNames = [
    getI2STxEnable() ? getI2STxBufferName() : null,
    getI2STxEnable() ? getI2SRawDataBufferName() : null,
    getI2SRxEnable() ? getI2SRxBufferName() : null
  ].filter(Boolean);

  const uniqueNames = new Set(bufferNames);
  return uniqueNames.size !== bufferNames.length;
}
