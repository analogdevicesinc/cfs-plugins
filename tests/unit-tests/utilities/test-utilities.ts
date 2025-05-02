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

import { promises as fs } from "node:fs";
import path from "node:path";
import { CfsPluginInfo } from "cfs-plugins-api";

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
