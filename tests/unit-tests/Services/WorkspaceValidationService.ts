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
import fg from "fast-glob";
import type { CfsWorkspace } from "cfs-types";
import { fileExists } from "../utilities/test-utilities.js";
import { joinPath } from "../utilities/path-utilities.js";

export class WorkspaceValidationService {
  /**
   * Validates that all expected files exist in the generated workspace.
   *
   * @param workspace - The workspace that was generated
   * @param expectedFiles - Array of expected file paths relative to the workspace root (hardcoded by the test author)
   */
  public async validateWorkspaceFiles(
    workspace: CfsWorkspace,
    expectedFiles: string[],
  ) {
    console.log(`Validating ${expectedFiles.length} files...`);

    for (const expectedFile of expectedFiles) {
      const actualFilePath = joinPath(
        workspace.location,
        workspace.workspaceName,
        expectedFile,
      );
      const actualFileExists = await fileExists(actualFilePath);
      expect(
        actualFileExists,
        `File ${expectedFile} does not exist in workspace at ${actualFilePath}`,
      ).to.be.true;
    }

    const workspacePath = joinPath(workspace.location, workspace.workspaceName);
    const actualFiles = await fg("**/*", { cwd: workspacePath, dot: true });
    const actualFolders = await fg("**/*", { cwd: workspacePath, dot: true, onlyDirectories: true });

    const expectedFileSet = new Set(
      expectedFiles.map((f) => f.replace(/\\/g, "/")),
    );
    const unexpectedFiles = actualFiles.filter((f) => !expectedFileSet.has(f));
    expect(
      unexpectedFiles,
      `Unexpected files found in workspace:\n${unexpectedFiles.join("\n")}`,
    ).to.have.lengthOf(0);

    const expectedFolderSet = new Set<string>();
    for (const f of expectedFiles) {
      const parts = f.replace(/\\/g, "/").split("/");
      for (let i = 1; i < parts.length; i++) {
        expectedFolderSet.add(parts.slice(0, i).join("/"));
      }
    }
    const unexpectedFolders = actualFolders.filter((f) => !expectedFolderSet.has(f));
    expect(
      unexpectedFolders,
      `Unexpected folders found in workspace:\n${unexpectedFolders.join("\n")}`,
    ).to.have.lengthOf(0);
  }

  /**
   * Validates that files exist under the expected core directory and that
   * no other unexpected top-level directories are present.
   *
   * @param workspace - The workspace that was generated
   * @param expectedCoreDir - The expected core directory (e.g., "m33")
   * @param excludeDirs - Top-level directories to ignore (default: [".cfs"])
   */
  public async validateDirectoryStructure(
    workspace: CfsWorkspace,
    expectedCoreDir: string,
    excludeDirs: string[] = [".cfs"],
  ): Promise<void> {
    const workspacePath = joinPath(workspace.location, workspace.workspaceName);

    const allFilesAndFolders = await fg("**/*", { cwd: workspacePath, dot: true, onlyFiles: false });

    const coreFiles = allFilesAndFolders.filter((f) =>
      f.startsWith(`${expectedCoreDir}/`),
    );

    expect(coreFiles.length).to.be.greaterThan(
      0,
      `No files found in core directory "${expectedCoreDir}/" - workspace generation may have failed`,
    );

    const unexpectedDirs = new Set<string>();

    for (const file of allFilesAndFolders) {
      if (!file.includes("/")) continue;
      const topDir = file.split("/")[0];
      if (topDir !== expectedCoreDir && !excludeDirs.includes(topDir)) {
        unexpectedDirs.add(topDir);
      }
    }

    expect(
      unexpectedDirs.size,
      `Unexpected top-level directories found: [${[...unexpectedDirs].join(", ")}]. Only "${expectedCoreDir}/" expected for SOC "${workspace.soc}"`,
    ).to.equal(0);
  }
}
