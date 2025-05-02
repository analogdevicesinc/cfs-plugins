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

import path from "path";
import * as fs from "fs/promises";
import {
  CfsPluginInfo,
  CfsProjectConfigService,
  ConfiguredProject,
} from "cfs-plugins-api";

/**
 * Service for providing default project configuration by CFS plugins
 * This implementation of the service overrides project configuration with
 * whatever information is provided on files stored on path
 * <plugin-dir>/config-patches/<SoC-ID>/<Core-ID>.json
 *
 * If the file does not exist, input project configuration is returned unmodified
 */
export class CfsJsonProjectConfig implements CfsProjectConfigService {
  /**
   * Constructor
   * @param cfsPluginInfo - The plugin information containing property directives
   */
  constructor(protected cfsPluginInfo: CfsPluginInfo) {}

  /**
   * Taken from cfs-plugins-api/CfsProjectConfigService
   *
   * Receives a project configuration (from .cfsconfig file) and returns an updated version
   * of that configuration.
   * @param soc - Id of the SoC to which the project is assigned
   * @param config - Configuration of the project, read from .cfsconfig file
   * @returns Configuration of the project, potentially modified.
   */
  async configureProject(soc: string, config: ConfiguredProject) {
    const pluginDir = path.dirname(this.cfsPluginInfo.pluginPath);
    const patchDir = path.join(
      pluginDir,
      "config-patches",
      soc.toLocaleUpperCase(),
      `${config.CoreId.toLowerCase()}.json`,
    );

    try {
      const patch = JSON.parse(await fs.readFile(patchDir, "utf-8"));
      config = { ...config, ...patch };
    } catch {
      // Do nothing if file is not fouund,
      // Input config will be returned
    }
    return config;
  }
}
