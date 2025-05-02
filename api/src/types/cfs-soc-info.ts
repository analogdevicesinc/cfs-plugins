/**
 *
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
 *
 */

/**
 * SoC information stored in the .cfsplugin file
 */
export interface CfsSocInfo {
  /**
   * The name of the SoC
   */
  name: string;

  /**
   * The name of the SoC Data Model associated with this SoC
   */
  dataModel: string;

  /**
   * The firmware platform board name, e.g. "EvKit_V1" for MSDK or "max32690evkit/max32690/m4"
   */
  board: string;

  /**
   * The SoC package name, e.g. "WLP"
   */
  package: string;
}
