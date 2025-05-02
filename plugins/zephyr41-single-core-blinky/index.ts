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

import { CfsPlugin, CfsFeatureScope, CfsWorkspace } from "cfs-plugins-api";
import { CfsEtaWorkspaceGenerator } from "../common/generators/index.js";
import path from "path";

class Plugin extends CfsPlugin {
  getService<T>(service: string): T {
    throw new Error("Method not implemented.");
  }

  getEnvironmentVariables() {
    return [];
  }

  getGenerator<T>(generator: CfsFeatureScope): T {
    switch (generator) {
      case CfsFeatureScope.Workspace:
        return new CfsEtaWorkspaceGenerator(
          path.dirname(this.cfsPluginInfo.pluginPath),
          this.cfsPluginInfo.features.workspace,
          this.context as CfsWorkspace,
        ) as T;
      default:
        throw new Error(`Generator: ${generator} is not supported`);
    }
  }
}

export default Plugin;
