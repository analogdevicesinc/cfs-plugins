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

import { CfsConfig, ConfiguredProject } from "../types/cfs-config.js";
import { CfsFeatureScope } from "../types/cfs-feature.js";
import { CfsPluginProperty } from "../types/cfs-plugin-property.js";
import {
  CfsSocDataModel,
  SocControl
} from "../types/cfs-soc-data-model.js";

export enum CfsServiceType {
  SocControlOverride = "socControlOverride",
  ProjectConfig = "projectConfig",
  SystemConfig = "systemConfig"
}

export interface CfsSocControlsOverrideService {
  /**
   * Override Soc controls following a set of directives provided in the plugin info.
   * @param scope - The scope of properties to retrieve (Peripheral, PinConfig, etc.)
   * @param soc - Optional SoC data model containing control definitions
   * @returns The properties with control directives applied
   */
  overrideControls(
    scope: CfsFeatureScope,
    soc?: CfsSocDataModel
  ): Record<string, SocControl[]> | CfsPluginProperty[];
}

export interface CfsProjectConfigService {
  /**
   * Receives a project configuration (from .cfsconfig file) and returns an updated version
   * of that configuration.
   * @param soc - Id of the SoC to which the project is assigned
   * @param config - Configuration of the project, read from .cfsconfig file
   * @returns Configuration of the project, potentially modified.
   */
  configureProject(
    soc: string,
    config: ConfiguredProject
  ): Promise<ConfiguredProject>;
}

export interface CfsSystemConfigService {
  /**
   * Receives a complete CfsConfig and returns an updated version of that configuration.
   * This is requested only on the primary core.
   * @param config - Configuration of the project, read from .cfsconfig file
   * @returns CfsConfig, potentially modified.
   */
  configureSystem(config: CfsConfig): Promise<CfsConfig>;
}
