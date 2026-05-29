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
 * Shared helper functions for CAN peripheral configuration
 */

// Return the name of the callback function used for unit events
function getCANUnitCallback() {
  const callback = getPeriConfigValue(it.instance, "UNIT_CB", "");
  return callback ? callback : "NULL";
}

// Return the name of the callback function used for object events
function getCANObjCallback() {
  const callback = getPeriConfigValue(it.instance, "OBJ_CB", "");
  return callback ? callback : "NULL";
}

// Return the numeric index for the CAN instance (0 for CAN0, 1 for CAN1)
function getCANPeripheralIndex() {
  if (it.instance === "CAN0") {
    return 0;
  } else if (it.instance === "CAN1") {
    return 1;
  } else {
    return 0;
  }
}
