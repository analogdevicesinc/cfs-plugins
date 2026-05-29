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
 * Shared helper functions for ADC SD10 peripheral configuration
 */

// Is the monitor being used?
function adcMonitorEnabled(idx) {
  let chLoLimitEnable = getPeriConfigValue(it.instance, `CH_LO_LIMIT_EN_IDX${idx.toString()}`, "FALSE");
  let chHiLimitEnable = getPeriConfigValue(it.instance, `CH_HI_LIMIT_EN_IDX${idx.toString()}`, "FALSE");
  return chLoLimitEnable === "TRUE" || chHiLimitEnable === "TRUE";
}
