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
import {
  CfsCodeGenerationService,
  CfsConfig,
  CfsEtaCodeGenerator,
  CfsEtaProjectGenerator,
  CfsFeatureScope,
  CfsJsonProjectConfig,
  CfsJsonSystemConfig,
  CfsPluginInfo,
  CfsPluginProperty,
  CfsProject,
  CfsProjectConfigService,
  CfsProjectGenerationService,
  CfsPropertyProviderService,
  CfsSocControlsOverrideService,
  CfsSocDataModel,
  CfsSystemConfigService,
  ConfiguredProject,
  SocControl
} from "cfs-plugins-api";
import { PropertyProvider } from "./services/property-provider.js";

class MsdkProjectPlugin
  implements
    CfsProjectGenerationService,
    CfsCodeGenerationService,
    CfsPropertyProviderService,
    CfsSocControlsOverrideService,
    CfsProjectConfigService,
    CfsSystemConfigService
{
  private projectGenerator: CfsEtaProjectGenerator;
  private codeGenerator: CfsEtaCodeGenerator;
  private propertyProvider: PropertyProvider;
  private projectConfig: CfsJsonProjectConfig;
  private systemConfig: CfsJsonSystemConfig;

  constructor(protected cfsPluginInfo: CfsPluginInfo) {
    this.projectGenerator = new CfsEtaProjectGenerator(
      path.dirname(cfsPluginInfo.pluginPath),
      cfsPluginInfo.features.project
    );
    this.codeGenerator = new CfsEtaCodeGenerator(
      path.dirname(cfsPluginInfo.pluginPath),
      cfsPluginInfo.features.codegen
    );
    this.propertyProvider = new PropertyProvider(cfsPluginInfo);
    this.projectConfig = new CfsJsonProjectConfig(cfsPluginInfo);
    this.systemConfig = new CfsJsonSystemConfig(cfsPluginInfo);
  }

  async generateProject(
    baseDir: string,
    context: CfsProject
  ): Promise<void> {
    return this.projectGenerator.generateProject(baseDir, context);
  }

  async generateCode(
    data: Record<string, unknown>,
    baseDir: string
  ): Promise<string[]> {
    return this.codeGenerator.generateCode(data, baseDir);
  }

  getProperties(
    scope: CfsFeatureScope,
    context?: Record<string, unknown>
  ): CfsPluginProperty[] {
    return this.propertyProvider.getProperties(scope, context);
  }

  overrideControls(
    scope: CfsFeatureScope,
    soc: CfsSocDataModel
  ): Record<string, SocControl[]> {
    return this.propertyProvider.overrideControls(scope, soc);
  }

  async configureProject(
    soc: string,
    config: ConfiguredProject
  ): Promise<ConfiguredProject> {
    return this.projectConfig.configureProject(soc, config);
  }

  async configureSystem(config: CfsConfig): Promise<CfsConfig> {
    return this.systemConfig.configureSystem(config);
  }
}

export default MsdkProjectPlugin;
