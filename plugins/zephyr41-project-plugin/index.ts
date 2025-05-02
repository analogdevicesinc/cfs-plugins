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

import { CfsCodeGenerationPlugin } from "../common/classes/cfs-code-generation-plugin.js";
import {
  CfsEtaCodeGenerator,
  CfsEtaProjectGenerator,
} from "../common/generators/index.js";
import { CfsFeatureScope } from "cfs-plugins-api";
import path from "path";

class Zephyr41ProjectPlugin extends CfsCodeGenerationPlugin {
  getGenerator<T>(generator: CfsFeatureScope): T {
    switch (generator) {
      case CfsFeatureScope.Project: {
        return new CfsEtaProjectGenerator(
          path.dirname(this.cfsPluginInfo.pluginPath),
          this.cfsPluginInfo.features.project,
          this.context,
        ) as T;
      }
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
}

export default Zephyr41ProjectPlugin;
