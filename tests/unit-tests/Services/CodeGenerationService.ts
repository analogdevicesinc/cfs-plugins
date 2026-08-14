/**
 *
 * Copyright (c) 2025-2026 Analog Devices, Inc.
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
import { expect } from "chai";
import {
  fileExists,
  loadPluginInfo,
  validateGeneratedFileContent,
} from "@utilities/test-utilities.js";
import type { CfsCodeGenerationContext, CfsSocDataModel } from "cfs-types";
import ZephyrProjectPlugin from "@plugins/zephyr-project-plugin/index.js";
import MsdkProjectPlugin from "@plugins/msdk-project-plugin/index.js";
import SharcFxProjectPlugin from "@plugins/sharcfx-project-plugin/index.js";
import { joinPath } from "@utilities/path-utilities.js";

/**
 * Service for validating code generation results against explicitly provided expected file paths.
 */
export class CodeGenerationService {
  /**
   * Validates that generated files match the expected destinations and exist on disk.
   *
   * @param generatedFiles - Array of file paths that were generated
   * @param expectedFiles - Array of expected destination file paths (hardcoded by the test author)
   * @param basePath - Base directory path to verify files exist on disk
   */
  public async validateGeneratedFiles(
    generatedFiles: string[],
    expectedFiles: string[],
    basePath: string,
  ): Promise<void> {
    expect(generatedFiles).to.be.an(
      "array",
      "Generated files should be an array",
    );

    for (const expectedDst of expectedFiles) {
      const matched = generatedFiles.some((file) =>
        this.fileMatches(file, expectedDst, basePath),
      );
      expect(
        matched,
        `Expected file '${expectedDst}' was not found in generated files`,
      ).to.be.true;

      const fullPath = joinPath(basePath, expectedDst);
      const exists = await fileExists(fullPath);
      expect(exists, `Expected file does not exist on disk: ${fullPath}`).to.be
        .true;

      await validateGeneratedFileContent(fullPath);
    }

    const unexpectedFiles = generatedFiles.filter(
      (generated) =>
        !expectedFiles.some((expectedDst) =>
          this.fileMatches(generated, expectedDst, basePath),
        ),
    );
    expect(
      unexpectedFiles,
      `Unexpected generated files not in expected list:\n${unexpectedFiles.join("\n")}`,
    ).to.have.lengthOf(0);

    // Guard against duplicate generated paths: with the subset checks above,
    // an exact count match makes generatedFiles a 1:1 match of expectedFiles.
    expect(
      generatedFiles,
      `Generated file count (${generatedFiles.length}) does not match expected (${expectedFiles.length}); possible duplicate generated paths:\n${generatedFiles.join("\n")}`,
    ).to.have.lengthOf(expectedFiles.length);
  }

  /**
   * Runs code generation for a given plugin and project, returning the generated file paths.
   */
  public async runCodeGeneration(
    projectDetails: any,
    socDataModel: CfsSocDataModel,
    basePath: string,
  ): Promise<string[]> {
    const plugin = await this.createPlugin(projectDetails.pluginId as string);
    const context: CfsCodeGenerationContext = {
      cfsconfig: projectDetails.cfsconfig,
      datamodel: socDataModel,
      projectId: projectDetails.projectId as string,
      coreId: projectDetails.coreId as string,
    };
    return plugin.generateCode(context, basePath);
  }

  private async createPlugin(pluginId: string): Promise<any> {
    switch (pluginId) {
      case "com.analog.project.zephyr.plugin":
        const zephyrProjectPluginPath =
          "plugins/dist/zephyr-project-plugin/.cfsplugin";
        return new ZephyrProjectPlugin(
          await loadPluginInfo(zephyrProjectPluginPath),
        );
      case "com.analog.project.msdk.plugin":
        const msdkProjectPluginPath =
          "plugins/dist/msdk-project-plugin/.cfsplugin";
        return new MsdkProjectPlugin(
          await loadPluginInfo(msdkProjectPluginPath),
        );
      case "com.analog.project.sharcfx.plugin":
        const sharcFxProjectPluginPath =
          "plugins/dist/sharcfx-project-plugin/.cfsplugin";
        return new SharcFxProjectPlugin(
          await loadPluginInfo(sharcFxProjectPluginPath),
        );
      default:
        throw new Error(`Unsupported plugin ID: ${pluginId}`);
    }
  }

  private fileMatches(
    filePath: string,
    destination: string,
    basePath: string,
  ): boolean {
    const normalizedPath = filePath.replace(/\\/g, "/");
    const normalizedBase = basePath.replace(/\\/g, "/").replace(/\/$/, "");
    const normalizedDst = destination.replace(/\\/g, "/");
    const expectedFullPath = `${normalizedBase}/${normalizedDst}`;
    return normalizedPath === expectedFullPath;
  }
}
