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
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect } from "chai";
import {
  fileExists,
  loadPluginInfo,
  validateGeneratedFileContent,
} from "@utilities/test-utilities.js";
import { readPackageIndex } from "@utilities/package-index.js";
import type { CfsCodeGenerationContext, CfsSocDataModel } from "cfs-types";
import ZephyrProjectPlugin from "@plugins/zephyr-project-plugin/index.js";
import MsdkProjectPlugin from "@plugins/msdk-project-plugin/index.js";
import SharcFxProjectPlugin from "@plugins/sharcfx-project-plugin/index.js";
import { joinPath } from "@utilities/path-utilities.js";

const ZEPHYR_PROJECT_PLUGIN_ID = "com.analog.project.zephyr.plugin";

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
    options: { withBoardDts?: boolean } = {},
  ): Promise<string[]> {
    const plugin = await this.createPlugin(projectDetails.pluginId as string);
    const boardDts = options.withBoardDts
      ? this.resolveBoardDts(projectDetails)
      : undefined;
    const context: CfsCodeGenerationContext = {
      cfsconfig: projectDetails.cfsconfig,
      datamodel: socDataModel,
      projectId: projectDetails.projectId as string,
      coreId: projectDetails.coreId as string,
      ...(boardDts ? { boardDts } : {}),
    };
    return plugin.generateCode(context, basePath);
  }

  /**
   * Build-test-only: produces the `boardDts` code-generation input by parsing the
   * Zephyr board devicetree with `cfsutil dt parse`, mirroring what the product
   * injects at generation time. Zephyr overlay templates gate memory/partition
   * fixes (e.g. `/delete-node/ &m4_sram`) on `hasSocNodeLabel(...)`, which reads
   * `it.boardDts`; without it the generated overlay drifts from the product and
   * fails the Zephyr 4.4.x devicetree build. Opt-in (only the build test passes
   * `withBoardDts`) so code-generation validation tests stay free of cfsutil.
   * Returns `undefined` silently for non-Zephyr projects, which never read
   * `boardDts`. For a Zephyr project every failure is a real one - generation
   * still proceeds without board-dts context, as before, but a warning names
   * the reason so a broken cfsutil or Zephyr install is distinguishable from
   * "not applicable" instead of quietly skipping the overlay fix.
   */
  private resolveBoardDts(
    projectDetails: any,
  ): Record<string, unknown> | undefined {
    const { pluginId, projectId } = projectDetails as {
      pluginId?: string;
      projectId?: string;
    };

    // Only the Zephyr overlay template reads boardDts, so anything else is not
    // applicable rather than broken. Keyed off the plugin id, not a missing
    // ZephyrBoardName, so a Zephyr project with a bad cfsconfig still warns.
    if (pluginId !== ZEPHYR_PROJECT_PLUGIN_ID) {
      return undefined;
    }

    const warn = (reason: string): void => {
      console.warn(`[boarddts:unavailable] ${reason}`);
    };

    const cfsUtil = process.env.CFS_UTIL_CMD;
    if (!cfsUtil) {
      warn("CFS_UTIL_CMD is not set");
      return undefined;
    }
    const projects = projectDetails?.cfsconfig?.Projects ?? [];
    const project =
      projects.find((p: any) => p.ProjectId === projectDetails.projectId) ??
      projects[0];
    const boardName = project?.PlatformConfig?.ZephyrBoardName as
      | string
      | undefined;
    if (!boardName) {
      warn(`no ZephyrBoardName in cfsconfig for project '${projectId}'`);
      return undefined;
    }
    const zephyrBase = this.resolveZephyrBase();
    if (!zephyrBase) {
      warn(`no installed Zephyr package found for board '${boardName}'`);
      return undefined;
    }
    const boardDir = boardName.split("/")[0];
    const dtsPath = path.join(
      zephyrBase,
      "boards",
      "adi",
      boardDir,
      `${boardName.replace(/\//g, "_")}.dts`,
    );
    if (!existsSync(dtsPath)) {
      warn(`board devicetree not found: ${dtsPath}`);
      return undefined;
    }
    const outFile = path.join(
      os.tmpdir(),
      `cfs-boarddts-${process.pid}-${Date.now()}.json`,
    );
    try {
      execFileSync(
        cfsUtil,
        [
          "dt",
          "parse",
          dtsPath,
          "-f",
          "json",
          "-o",
          outFile,
          "-I",
          path.join(zephyrBase, "dts"),
          "-I",
          path.join(zephyrBase, "dts", "arm"),
          "-I",
          path.join(zephyrBase, "dts", "common"),
          "-I",
          path.join(zephyrBase, "dts", "vendor"),
        ],
        // A shell on Windows, matching WorkspaceBuildService: the documented
        // Windows CFS_UTIL_CMD is the kit's `cfs.cmd`, which execFileSync
        // cannot launch directly. Without this the call throws, the catch
        // below drops boardDts, and Windows build tests silently lose the fix.
        { stdio: "pipe", shell: process.platform === "win32" },
      );
      return JSON.parse(readFileSync(outFile, "utf-8")) as Record<
        string,
        unknown
      >;
    } catch (error) {
      warn(
        `cfsutil dt parse failed for ${dtsPath}: ${(error as Error).message}`,
      );
      return undefined;
    } finally {
      try {
        rmSync(outFile, { force: true });
      } catch {
        // best-effort cleanup
      }
    }
  }

  /**
   * Resolves the installed Zephyr package's base directory (the west workspace
   * `.../<hash>/f/zephyr`) from the package manager's `.cfsPackages` index, the
   * same index `cfsutil pkg path` reads.
   */
  private resolveZephyrBase(): string | undefined {
    const entry = readPackageIndex().zephyr;
    if (!entry?.path) {
      return undefined;
    }
    const base = path.join(path.dirname(entry.path), "f", "zephyr");
    return existsSync(base) ? base : undefined;
  }

  private async createPlugin(pluginId: string): Promise<any> {
    switch (pluginId) {
      case ZEPHYR_PROJECT_PLUGIN_ID:
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
