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
import { expect } from "chai";

// Helper function to search recursively for JSON files in the workspace
export const findJsonFiles = async (dirPath: string): Promise<string[]> => {
  let results: string[] = [];

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        const subDirFiles = await findJsonFiles(fullPath);
        results = results.concat(subDirFiles);
      } else if (
        entry.isFile() &&
        path.extname(entry.name).toLowerCase() === ".json"
      ) {
        results.push(fullPath);
      }
    }
  } catch (err: any) {
    console.error(`Error reading directory '${dirPath}': ${err.message}`);
  }

  return results;
};

// Helper function to validate (non-empty) JSON files
export const validateJsonFile = async (jsonFile: string): Promise<boolean> => {
  // We might generate empty files. as stubs or placeholders. Ignore them.
  const stats = await fs.stat(jsonFile);
  if (stats.size === 0) {
    return true;
  }

  try {
    const data = await fs.readFile(jsonFile, "utf-8");
    JSON.parse(data);
  } catch (err: any) {
    return false;
  }
  return true;
};
