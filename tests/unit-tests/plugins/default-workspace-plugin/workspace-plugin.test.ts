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
import { GenericPlugin } from "cfs-plugins-sdk";
import { isDebug } from "@utilities/test-utilities.js";
import { WorkspaceValidationService } from "@services/WorkspaceValidationService.js";

describe("Unit test for WorkspacePlugin", () => {
  let plugin: GenericPlugin;
  let pluginInfo: CfsPluginInfo;

  const cfsWorkspace = {
    location: "tests/unit-tests/plugins/data",
    workspacePluginId: "com.analog.workspace.default.plugin",
    workspacePluginVersion: "1.0.0",
    workspaceName: "test-workspace",
    copyrightDate: new Date().getFullYear().toString(),
    dataModelVersion: "1.0.0",
    dataModelSchemaVersion: "1.0.0",
    package: "test-package",
    timestamp: new Date().toISOString(),
    board: "test-board",
    soc: "MAX32690",
    projects: [
      {
        name: "m4",
        path: "./m4",
        platformConfig: { ProjectName: "m4" },
      },
      {
        name: "riscv",
        path: "./riscv",
        platformConfig: { ProjectName: "riscv" },
      },
    ],
  };

  before(async () => {
    try {
      const filePath = "plugins/dist/default-workspace-plugin/.cfsplugin";
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

  it("Should generate the workspace", async () => {
    await plugin.generateWorkspace(cfsWorkspace as unknown as CfsWorkspace);

    // MAX32690 satisfies every gdb_toolbox condition, so the full toolbox tree
    // (shared source/destination mappings) must be produced.
    const expectedWorkspaceFiles = [
      ".cfs/.cfsworkspace",
      `.cfs/${cfsWorkspace.workspaceName}.cfsconfig`,
      ".cfs/gdb_toolbox/configs/fault-analyzer.json",
      ".cfs/gdb_toolbox/configs/memory-dump.json",
      ".cfs/gdb_toolbox/configs/register-dump.json",
      ".cfs/gdb_toolbox/configs/crash-cause-zephyr.json",
      ".cfs/gdb_toolbox/configs/thread-analyzer.json",
      ".cfs/gdb_toolbox/configs/heap-analyzer.json",
      ".cfs/gdb_toolbox/gdb/fault-analyzer-arm.gdb",
      ".cfs/gdb_toolbox/gdb/fault-analyzer-xtensa.gdb",
      ".cfs/gdb_toolbox/gdb/heap-analyzer.gdb",
      ".cfs/gdb_toolbox/gdb/crash-cause-zephyr.gdb",
      ".cfs/gdb_toolbox/gdb/thread-analyzer.gdb",
      `${cfsWorkspace.workspaceName}.code-workspace`,
    ];

    const workspaceValidationService = new WorkspaceValidationService();
    await workspaceValidationService.validateWorkspaceFiles(
      cfsWorkspace as unknown as CfsWorkspace,
      expectedWorkspaceFiles,
    );
  });
});
