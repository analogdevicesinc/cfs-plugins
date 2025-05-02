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

import {
  CfsPlugin,
  CfsFeatureScope,
  type CfsPluginProperty,
  type CfsSocDataModel,
  type SocControl,
  CfsServiceType,
  CfsSocControlsOverrideService,
} from "cfs-plugins-api";

import { CfsEtaCodeGenerator, CfsEtaProjectGenerator } from "../generators";
import { CfsSocControlsOverride } from "../cfs-services/cfs-soc-controls-override";
import path from "path";
import { CfsJsonProjectConfig } from "../cfs-services/cfs-json-project-config";
import { CfsJsonSystemConfig } from "../cfs-services/cfs-json-system-config";

export class CfsCodeGenerationPlugin extends CfsPlugin {
  getService<T>(service: string): T | undefined {
    switch (service) {
      case CfsServiceType.SocControlOverride:
        return new CfsSocControlsOverride(this.cfsPluginInfo) as T;
      case CfsServiceType.ProjectConfig:
        return new CfsJsonProjectConfig(this.cfsPluginInfo) as T;
      case CfsServiceType.SystemConfig:
        return new CfsJsonSystemConfig(this.cfsPluginInfo) as T;
      default:
        return undefined;
    }
  }

  getGenerator<T>(generator: CfsFeatureScope): T {
    switch (generator) {
      case CfsFeatureScope.Project:
        return new CfsEtaProjectGenerator(
          path.dirname(this.cfsPluginInfo.pluginPath),
          this.cfsPluginInfo.features.project,
          this.context,
        ) as T;
      case CfsFeatureScope.CodeGen: {
        return new CfsEtaCodeGenerator(
          path.dirname(this.cfsPluginInfo.pluginPath),
          this.cfsPluginInfo.features.codegen,
          this.context,
        ) as T;
      }
      default:
        throw new Error(`Generator: ${generator} is not supported`);
    }
  }

  getEnvironmentVariables() {
    return [];
  }

  getProperties(
    scope: CfsFeatureScope,
    soc?: CfsSocDataModel,
  ): Record<string, SocControl[]> | CfsPluginProperty[] {
    // Use the SocControlOverride service if available
    if (soc) {
      const propertyService = this.getService<CfsSocControlsOverrideService>(
        CfsServiceType.SocControlOverride,
      );
      if (propertyService !== undefined) {
        return propertyService.overrideControls(scope, soc);
      }
    }

    // Fall back to the base implementation for simple cases
    return super.getProperties(scope);
  }
}
