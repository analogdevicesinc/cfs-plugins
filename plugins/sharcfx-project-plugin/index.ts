/**
 *
 * Copyright (c) 2026 Analog Devices, Inc.
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

import { rm, rmdir } from "fs/promises";
import path from "path";
import { GenericPlugin } from "cfs-plugins-sdk";
import type { CfsConfig } from "cfs-types";

class SharcFxProjectPlugin extends GenericPlugin {
  override async generateCode(
    data: Record<string, unknown>,
    baseDir: string
  ): Promise<string[]> {
    const projectName = (
      (data.cfsconfig as CfsConfig).Projects.find(
        (project) => project.ProjectId === data.projectId
      )?.PlatformConfig as { ProjectName?: string } | undefined
    )?.ProjectName;

    // Headers are only rendered for assigned peripherals, so drop stale ones first.
    if (projectName) {
      const root = path.resolve(baseDir);
      const projectDir = path.resolve(root, projectName);
      const relative = path.relative(root, projectDir);
      if (
        !relative ||
        relative === ".." ||
        relative.startsWith(`..${path.sep}`) ||
        path.isAbsolute(relative)
      ) {
        throw new Error(
          `Invalid project name "${projectName}": it must resolve to a folder inside the code generation directory.`
        );
      }

      const includeDir = path.join(projectDir, "include");
      await rm(path.join(includeDir, "ssdd"), {
        recursive: true,
        force: true
      });
      // Keep include/ if it holds user files.
      await rmdir(includeDir).catch((error: unknown) => {
        const code = (error as NodeJS.ErrnoException).code ?? "";
        if (!["ENOENT", "ENOTEMPTY", "EEXIST"].includes(code)) {
          throw error;
        }
      });
    }

    return super.generateCode(data, baseDir);
  }

  override getMemoryAccessOverrides(
    partName: string,
    coreId: string
  ): Record<string, string[] | undefined> | undefined {
    /** NOTE Currently we disable memory access selection for all parts.
     * If needed we can add specific overrides for SharcFX parts
     * by checking the partName and returning appropriate overrides.
     */

    if (coreId === "FX") {
      return {
        RAM: [],
        Flash: []
      };
    }

    // default behavior
    return super.getMemoryAccessOverrides(partName, coreId);
  }
}

export default SharcFxProjectPlugin;
