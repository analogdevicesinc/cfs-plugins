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

import * as fs from "fs/promises";
import * as path from "path";
import { CfsFileMap } from "cfs-plugins-api";
import { CfsCopyFilesService } from "./cfs-plugin-services.js";
import { glob } from "glob";
import {
  evalNestedTemplateLiterals,
  isDir,
} from "../utilities/cfs-utilities.js";

/**
 * Copies the provided files to the specified destination.
 *
 * @param files - An array of CfsFileMap objects representing the files to be copied.
 * @returns A promise that resolves when the files have been copied.
 */
export class CfsFsCopyFilesService implements CfsCopyFilesService {
  /**
   * Constructor
   * @param pluginPath - The path to the plugin.
   * @param context - The context containing workspace information.
   */
  constructor(
    protected pluginPath: string,
    protected context: Record<string, unknown>
  ) {}

  async copyFiles(files: CfsFileMap[], baseDir?: string): Promise<void> {
    for (const file of files) {
      try {
        // Probably deriving this from the context is not the most reliable way to get the location
        // unless all configuration files share the same interface. the client of this service usually knows where files should go to.
        const location = (baseDir ?? this.context.path ?? "") as string;

        const dstPath = evalNestedTemplateLiterals(
          path.join(location, file.dst).replace(/\\/g, "/"),
          this.context
        );
        const fullPath = path
          .join(this.pluginPath, file.src)
          .replace(/\\/g, "/");

        const filesToCopy = await glob(fullPath);

        for (const fileToCopy of filesToCopy) {
          const fileName = path.basename(fileToCopy);

          if (isDir(dstPath)) {
            await fs.mkdir(dstPath, { recursive: true });
            await fs.copyFile(fileToCopy, path.join(dstPath, fileName));
          } else {
            await fs.mkdir(path.dirname(dstPath), { recursive: true });
            await fs.copyFile(fileToCopy, dstPath);
          }
        }
      } catch (error) {
        throw new Error(
          `Failed to copy file from ${file.src} to ${file.dst}: ${error}`
        );
      }
    }
  }
}
