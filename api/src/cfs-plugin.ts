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

import { CfsServiceProvider } from "./services/cfs-service-provider.js";
import { CfsConfig } from "./types/cfs-config.js";
import { CfsFeatureScope } from "./types/cfs-feature.js";
import { CfsPluginInfo } from "./types/cfs-plugin-info.js";
import { CfsPluginProperty } from "./types/cfs-plugin-property.js";
import { CfsProject } from "./types/cfs-project.js";
import { SocControl } from "./types/cfs-soc-data-model.js";
import { CfsWorkspace } from "./types/cfs-workspace.js";
import { evalNestedTemplateLiterals } from "./utilities/cfs-utilities.js";

export abstract class CfsPlugin implements CfsServiceProvider {
  /**
   * Constructor
   * @param cfsPluginInfo - The .cfsplugin file contents
   * @param context - The context for this plugin
   */
  constructor(
    protected cfsPluginInfo: CfsPluginInfo,
    protected context: CfsWorkspace | CfsProject | CfsConfig
  ) {}

  /** Generators and Services */

  /**
   * Get a generator instance of the requested type
   * @param generator - The type of the generator (workspace, project, code)
   * @returns - An instance of the requested generator
   */
  public abstract getGenerator<T>(generator: string): T;

  /**
   * Get a service instance of the requested type
   * @param service - The name of the service to retrieve (e.g. "CfsControlOverrideService")
   * @returns - An instance of the requested service or undefined if the service is not provided
   */
  public abstract getService<T>(service: string): T | undefined;

  /** Plugin Properties */

  /**
   * Get all properties supported by the plugin. These are shown in the UI and passed back to the plugin via "setProperty"
   * @param scope - The scope of the properties to retrieve, such as "workspace", "project", "code", or "memory".
   * @returns The properties supported by the plugin.
   */
  public getProperties(
    scope: CfsFeatureScope
  ): CfsPluginProperty[] | Record<string, SocControl[]> {
    if (!(scope in (this.cfsPluginInfo.properties ?? {}))) {
      console.error(
        `Plugin ${this.cfsPluginInfo.pluginName} does not support properties for scope ${scope}`
      );

      return [];
    }

    return this.cfsPluginInfo.properties?.[scope] ?? [];
  }

  /** Environment Variables */

  /**
   * Pass environment variables from CFS to the plugin. This will include the CFS PATH and ZEPHYR variables.
   * @param env - The environment variables to set in a Key-Value pair.
   */
  public setEnvironmentVariables(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    env: Record<string, string>[]
  ): void {
    // do nothing by default
  }

  /**
   * Get environment variables that this plugin contributes
   * @param scope - The scope of the environment variables to retrieve, such as "workspace", "project", "code", or "memory".
   * @returns The environment variables to set in an array of Key-Value pairs.
   */
  public abstract getEnvironmentVariables(
    scope: string
  ): Record<string, string>[];

  /** Logging */

  /**
   * Write an info message to the plugin logs
   */
  public log(message: string) {
    // TODO: Write to a plugin log file
    console.log(message);
  }

  /**
   * Write a warning message to the plugin logs
   */
  public warn(message: string) {
    // TODO: Write to a plugin log file
    console.warn(message);
  }

  /**
   * Write an error message to the plugin logs
   */
  public error(message: string) {
    // TODO: Write to a plugin log file
    console.error(message);
  }
}
