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
  CfsSystemConfigService,
  CfsConfig,
} from "cfs-plugins-api";

/**
 * Service for providing default project configuration by CFS plugins
 * This implementation of the service overrides project configuration with
 * whatever information is provided on files stored on path
 * <plugin-dir>/config-patches/<SoC-ID>/<Core-ID>.json
 *
 * If the file does not exist, input project configuration is returned unmodified
 */
export class CfsJsonSystemConfig implements CfsSystemConfigService {
  /**
   * Constructor
   * @param cfsPluginInfo - The plugin information containing property directives
   */
  constructor(protected cfsPluginInfo: CfsPluginInfo) {}

  /**
   * Taken from cfs-plugins-api/CfsProjectConfigService
   *
   * Receives a complete CfsConfig and returns an updated version of that configuration.
   * This is requested only on the primary core.
   * @param config - Configuration of the project, read from .cfsconfig file
   * @returns CfsConfig, potentially modified.
   */
  async configureSystem(config: CfsConfig): Promise<CfsConfig> {
    const pluginDir = path.dirname(this.cfsPluginInfo.pluginPath);
    const patchDir = [
      pluginDir,
      "config-patches",
      config.Soc.toLocaleLowerCase(),
      "system.json",
    ].join("/");

    try {
      const patch = JSON.parse(await fs.readFile(patchDir, "utf-8"));
      // This overrides any content that comes in from the .cfsconfig with
      // the content from the patch. It is assumed we don't want or need to
      // merge the content.
      Object.keys(patch).forEach((key) => (config[key] = patch[key]));
    } catch {
      // Do nothing if file is not fouund,
      // Input config will be returned
    }
    return config;
  }
}
