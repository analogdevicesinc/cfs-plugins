/**
 *
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

import { CfsFileMap } from "./cfs-file-map.js";

export enum CfsFeatureScope {
  /**
   * Feature scope relating to workspace generation
   */
  Workspace = "workspace",

  /**
   * Feature scope relating to project generation
   */
  Project = "project",

  /**
   * Feature scope relating to code generation
   */
  CodeGen = "codegen",

  /**
   * Feature scope relating to memory allocation
   */
  Memory = "memory",

  /**
   * Feature scope relating to peripheral configuration
   */
  Peripheral = "peripheral",

  /**
   * Feature scope relating to Pin configuration
   */
  PinConfig = "pinConfig",

  /**
   * Feature scope relating to clock configuration
   */
  ClockConfig = "clockConfig",

  /**
   * Feature scope relating to data flow gasket configuration
   */
  DFG = "dfg",
}

export interface CfsFeature {
  /**
   * Files to copy over as-is
   */
  files: CfsFileMap[];

  /**
   * Templates to copy then run through the Eta template engine
   */
  templates: CfsFileMap[];
}
