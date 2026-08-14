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

import { promises as fs } from "node:fs";
import path from "node:path";
import { expect } from "chai";
import type { CfsPluginInfo, CfsWorkspace } from "cfs-types";
import { validateJsonFile } from "./validate-json.js";

// Helper function to load plugin info from a file
export const loadPluginInfo = async (
  filePath: string,
): Promise<CfsPluginInfo> => {
  const absolutePath = path.resolve(filePath);
  const fileContent = await fs.readFile(absolutePath, "utf-8");
  const pluginInfo = JSON.parse(fileContent) as CfsPluginInfo;
  pluginInfo.pluginPath = absolutePath;
  return pluginInfo;
};

// Helper function to check if a directory exists
export const directoryExists = async (dirPath: string): Promise<boolean> => {
  return fs
    .access(dirPath)
    .then(() => true)
    .catch(() => false);
};

// Helper function to check if a file exists
export const fileExists = async (filePath: string): Promise<boolean> => {
  return fs
    .access(filePath)
    .then(() => true)
    .catch(() => false);
};

/**
 * Check if the tests are run in debug mode
 * @returns True if the CFS_TEST_DEBUG environment variable is set to 1, false otherwise
 */
export function isDebug(): boolean {
  return process.env.CFS_TEST_DEBUG === "1";
}

/**
 * Delete workspace files from disk
 * @param cfsWorkspace Workspace to delete
 */
export async function deleteCreatedWorkspace(cfsWorkspace: CfsWorkspace) {
  if (!cfsWorkspace.location || !cfsWorkspace.workspaceName) {
    return;
  }

  const workspacePath = path.join(
    cfsWorkspace.location,
    cfsWorkspace.workspaceName,
  );

  await fs.rm(workspacePath, {
    recursive: true,
    force: true,
    maxRetries: 8,
    retryDelay: 150,
  });
}

/**
 * Helper function to get boards supported by each SoC of that plugin
 * @param plugin
 * @returns dictionary like structure. Each key has a list of boards that are supported
 */
export function getSocsBoardsDict(
  plugin: CfsPluginInfo,
): Record<string, string[]> {
  return plugin.supportedSocs.reduce(
    (acc, soc) => {
      if (!soc.board) {
        return acc;
      }

      if (!acc[soc.name]) {
        acc[soc.name] = [];
      }

      if (!acc[soc.name].includes(soc.board)) {
        acc[soc.name].push(soc.board);
      }

      return acc;
    },
    {} as Record<string, string[]>,
  );
}

/**
 * Replaces {{var}} with value from context
 * @param template
 * @param context
 * @returns original string with variables replaced
 */
export function replaceTemplateVariables(
  template: string,
  context: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return key in context ? context[key] : match;
  });
}

/**
 * Validates that a generated file on disk is non-empty, and—when it has a
 * .json extension—that its contents are valid JSON.
 * @param filePath Path to the file to validate
 */
export async function validateGeneratedFileContent(
  filePath: string,
): Promise<void> {
  const stats = await fs.stat(filePath);
  expect(
    stats.size,
    `Generated file is empty: ${filePath}`,
  ).to.be.greaterThan(0);

  if (path.extname(filePath).toLowerCase() === ".json") {
    const isValidJson = await validateJsonFile(filePath);
    expect(
      isValidJson,
      `Generated file is not valid JSON: ${filePath}`,
    ).to.be.true;
  }
}
