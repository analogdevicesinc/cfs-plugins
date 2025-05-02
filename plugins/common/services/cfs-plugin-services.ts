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
  CfsFeatureScope,
  CfsFileMap,
  CfsPluginProperty,
  CfsSocDataModel,
  SocControl,
} from "cfs-plugins-api";

export enum CfsPluginServiceType {
  CopyFiles = "copyFiles",
  Template = "template",
}

export interface CfsCopyFilesService {
  /**
   * Copy files defined in the .cfsplugin info file to their output directory
   * @param files - The files to copy
   * @param parentDir - The parent directory to copy files into (optional)
   */
  copyFiles(files: CfsFileMap[], parentDir?: string): Promise<void>;
}

export interface CfsTemplateService {
  /**
   * Run eta on all templates defined in the .cfsplugin info file and write the contents to the specified output directory
   * @param files - The template files to copy
   * @param data - The data needed for rendering eta templates.
   * @param parentDir - The parent directory to copy files into (optional)
   */
  renderTemplates(
    templates: CfsFileMap[],
    data: Record<string, unknown>,
    baseDir?: string,
  ): Promise<string[]>;
}
