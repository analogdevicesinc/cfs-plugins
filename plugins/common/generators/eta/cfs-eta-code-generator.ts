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
  CfsCodeGenerator,
  CfsConfig,
  ConfiguredProject,
} from "cfs-plugins-api";
import { CfsEtaGenerator } from "./cfs-eta-generator.js";
import {
  CfsCopyFilesService,
  CfsTemplateService,
  CfsPluginServiceType,
} from "../../services/cfs-plugin-services.js";
import path from "path";

export class CfsEtaCodeGenerator
  extends CfsEtaGenerator
  implements CfsCodeGenerator
{
  /**
   * Generates code by copying files and rendering templates.
   * @param data - The data needed for rendering eta templates.
   * @param baseDir - Directory location for the files generated.
   * @returns A promise that resolves when the code generation is complete.
   */
  async generateCode(
    data: Record<string, unknown>,
    baseDir: string
  ): Promise<string[]> {
    const projectId = data.projectId as string;

    const projectConfig = (data.cfsconfig as CfsConfig).Projects.find(
      (proj: ConfiguredProject) => proj.ProjectId === projectId
    );

    if (!projectConfig) {
      throw new Error(`Project with ID ${projectId} not found in cfsconfig.`);
    }

    const projectDir = path
      .join(
        baseDir,
        (projectConfig.PlatformConfig as { ProjectName: string }).ProjectName
      )
      .replace(/\\/g, "/");

    const copyFilesService = this.getService<CfsCopyFilesService>(
      CfsPluginServiceType.CopyFiles
    );

    await copyFilesService.copyFiles(this.cfsFeature.files, projectDir);

    const templateService = this.getService<CfsTemplateService>(
      CfsPluginServiceType.Template
    );

    const filesCreated = await templateService.renderTemplates(
      this.cfsFeature.templates,
      data,
      projectDir
    );
    return filesCreated;
  }
}
