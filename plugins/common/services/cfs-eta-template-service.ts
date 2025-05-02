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

import { CfsFileMap } from "cfs-plugins-api";
import { Eta, type EtaError } from "eta";
import { promises as fsp } from "fs";
import { glob } from "glob";
import path from "path";
import { CfsTemplateService } from "./cfs-plugin-services.js";
import {
  evalNestedTemplateLiterals,
  isDir,
} from "../utilities/cfs-utilities.js";

export class CfsEtaTemplateService implements CfsTemplateService {
  /**
   * Constructor
   * @param pluginPath - The path to the plugin.
   * @param context - The context for rendering the templates.
   */
  constructor(
    protected pluginPath: string,
    protected context: Record<string, unknown>
  ) {}

  async renderTemplates(
    templates: CfsFileMap[],
    data: Record<string, unknown>,
    baseDir?: string
  ): Promise<string[]> {
    const pluginsAbsolutePath = path.resolve(this.pluginPath, "..");
    const filesCreated: string[] = [];

    for (const template of templates) {
      const eta = new Eta({
        views: pluginsAbsolutePath,
        // By default ETA uses XMLEscape, which maps special HTML characters
        // (&, <, >, ", ') to their XML-escaped equivalents. We do not want
        // that for code generation.
        escapeFunction: String,
      });
      // Read note in cfs-fs-copy-files-service.ts
      const location = (baseDir ?? data.path ?? "") as string;

      try {
        const condition = template.condition ? evalNestedTemplateLiterals(template.condition, data) === "true" : true;

        if (!condition)
          // When condition is false, we skip the template.
          continue;
 
        let dstPath = evalNestedTemplateLiterals(template.dst, data);

        // Check if context is CfsWorkspace and make dst path relative to CfsWorkspace.location
        if (location) {
          dstPath = path.join(location, dstPath).replace(/\\/g, "/");
        } else {
          dstPath = template.dst;
        }

        const fullPath = path
          .join(this.pluginPath, template.src)
          .replace(/\\/g, "/");

        const files = await glob(fullPath);

        for (const file of files) {
          const fileName = path.basename(file.replace(".eta", ""));

          const relativePath = path
            .relative(pluginsAbsolutePath, file)
            .replace(/\\/g, "/");

          const rendered = eta.render(relativePath, {
            ...data,
            timestamp: new Date().toISOString(),
          });

          if (isDir(dstPath)) {
            await fsp.mkdir(dstPath, { recursive: true });
            dstPath = path.join(dstPath, fileName);
          } else {
            await fsp.mkdir(path.dirname(dstPath), { recursive: true });
          }
          await fsp.writeFile(dstPath, rendered);
          filesCreated.push(dstPath);
        }
      } catch (error) {
        console.error("Eta context:", data);
        throw new Error(
          `Failed to render template from ${template.src} to ${template.dst}: ${
            (error as EtaError).message || error
          }`
        );
      }
    }
    return filesCreated;
  }
}
