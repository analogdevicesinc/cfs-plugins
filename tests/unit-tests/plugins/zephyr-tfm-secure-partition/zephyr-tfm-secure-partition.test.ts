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
import { GenericPlugin } from "cfs-plugins-api/src/generic/cfs-generic-plugin.js";
import type { CfsPluginInfo } from "cfs-plugins-api";
import { isDebug } from "../../utilities/test-utilities.js";
import {
  validateJsonFile,
  findJsonFiles,
} from "../../utilities/validate-json.js";

describe("Unit test for Zephyr TF-M Secure Partition Plugin", () => {
  let plugin: GenericPlugin;
  let pluginInfo: CfsPluginInfo;
  const cfsWorkspace = {
    location: "tests/unit-tests/plugins/zephyr-tfm-secure-partition/data",
    workspacePluginId: "test-plugin-id",
    workspacePluginVersion: "1.0.0",
    workspaceName: "max32657-workspace",
    copyrightDate: new Date().getFullYear().toString(),
    dataModelVersion: "1.0.0",
    dataModelSchemaVersion: "1.0.0",
    package: "wlp",
    timestamp: new Date().toISOString(),
    board: "EvKit_V1",
    soc: "max32657",
    MCUbootImgtoolPath: "${cfs.sdk.path}/SDK/zephyr/bootloader/mcuboot/scripts",
    MCUbootKeyType: "rsa-3072",
    projects: [
      {
        name: "m33",
        path: "./m33",
      },
    ],
  };

  before(async () => {
    try {
      const filePath = "plugins/zephyr-tfm-secure-partition/.cfsplugin";
      const absolutePath = path.resolve(filePath);
      const fileContent = await fs.readFile(absolutePath, "utf-8");
      pluginInfo = JSON.parse(fileContent) as CfsPluginInfo;
      pluginInfo.pluginPath = absolutePath;
    } catch (error) {
      expect.fail(`${error}`);
    }
  });

  beforeEach(() => {
    plugin = new GenericPlugin(pluginInfo);
  });

  afterEach(async () => {
    if (!isDebug()) {
      await fs.rm(cfsWorkspace.location, { recursive: true, force: true });
    }
  });

  it("Should generate a workspace", async () => {
    await plugin.generateWorkspace(cfsWorkspace).catch((error: any) => {
      expect.fail(`${error}`);
    });

    // Confirm that valid JSON files were generated
    const jsonFiles = await findJsonFiles(cfsWorkspace.location);
    expect(jsonFiles.length).to.be.greaterThan(0, "No JSON files found");
    for (const file of jsonFiles) {
      const result = await validateJsonFile(file);
      expect(result, `Error: '${file}' is not a valid JSON file.`).to.be.true;
    }
  });
});
