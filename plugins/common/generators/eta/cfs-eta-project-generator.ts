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

import { CfsProjectGenerator } from "cfs-plugins-api";
import { CfsEtaGenerator } from "./cfs-eta-generator.js";
import {
  CfsCopyFilesService,
  CfsPluginServiceType,
  CfsTemplateService,
} from "../../services/cfs-plugin-services.js";

export class CfsEtaProjectGenerator
  extends CfsEtaGenerator
  implements CfsProjectGenerator
{
  /**
   * Generates the project by copying files and rendering templates.
   * @param baseDir - Directory location for the files generated.
   * @returns A promise that resolves when the project generation is complete.
   */
  async generateProject(baseDir?: string): Promise<void> {
    const copyFilesService = this.getService<CfsCopyFilesService>(
      CfsPluginServiceType.CopyFiles,
    );

    await copyFilesService.copyFiles(this.cfsFeature.files, baseDir);

    const templateService = this.getService<CfsTemplateService>(
      CfsPluginServiceType.Template,
    );

    await templateService.renderTemplates(
      this.cfsFeature.templates,
      this.context,
      baseDir,
    );
  }
}
