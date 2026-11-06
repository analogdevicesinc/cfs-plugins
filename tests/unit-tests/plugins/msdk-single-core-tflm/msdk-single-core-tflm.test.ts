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
import { expect } from "chai";
import { GenericPlugin } from "cfs-plugins-sdk";
import type { CfsWorkspace } from "cfs-types";
import { runWorkspacePluginSuite } from "@services/WorkspacePluginSuite.js";
import { CodeGenerationService } from "@services/CodeGenerationService.js";
import { joinPath } from "@utilities/path-utilities.js";
import {
  deleteCreatedWorkspace,
  isDebug,
  loadPluginInfo,
  resolveMakeVariable,
  stripVersionRange,
} from "@utilities/test-utilities.js";

const pluginInfo = await loadPluginInfo(
  "plugins/dist/msdk-single-core-tflm/.cfsplugin",
);

runWorkspacePluginSuite(pluginInfo, {
  suiteTitle: "MSDK Single Core TFLM Tests",
  dataDir: "tests/unit-tests/plugins/msdk-single-core-tflm/data",
  core: "m4",
  projects: [{ name: "m4", path: "./m4" }],
  projectPluginId: "com.analog.project.msdk.plugin",
  buildWorkspacePrefix: "tflm",
  buildable: true,
  expectedWorkspaceFiles: [
    "m4/.vscode/launch.json",
    "m4/.vscode/flash.gdb",
    "m4/hello_world_f32.tflite",
    "m4/README.md",
    "m4/src/main.cpp",
    ".cfs/gdb_toolbox/configs/fault-analyzer.json",
    ".cfs/gdb_toolbox/configs/memory-dump.json",
    ".cfs/gdb_toolbox/configs/register-dump.json",
    ".cfs/gdb_toolbox/configs/interrupt-status-arm.json",
    ".cfs/gdb_toolbox/configs/high-water-analyzer.json",
    ".cfs/gdb_toolbox/configs/stack-analyzer.json",
    ".cfs/gdb_toolbox/configs/stack-painter.json",
    ".cfs/gdb_toolbox/gdb/fault-analyzer-arm.gdb",
    ".cfs/gdb_toolbox/gdb/interrupt-status-arm.gdb",
    ".cfs/gdb_toolbox/gdb/high-water-analyzer.gdb",
    ".cfs/gdb_toolbox/gdb/stack-analyzer.gdb",
    ".cfs/gdb_toolbox/gdb/stack-painter.gdb",
    ".cfs/.cfsdependencies",
    ".cfs/.cfsworkspace",
    "m4/.vscode/settings.json",
    "m4/project.mk",
    "m4/Makefile",
    "m4/.vscode/c_cpp_properties.json",
    "m4/m4.jdebug",
    "m4/.vscode/cfs.tasks.json",
    "{{soc}}-{{board}}-workspace-gen.code-workspace",
    ".cfs/{{soc}}-{{package}}.cfsconfig",
  ],
  expectedCodeGenFiles: [
    "soc_init.c",
    "soc_init.h",
    "config.mk",
    "memory.ld",
    "aimodels.mk",
  ],
});

// Beyond the standard flow: prove aimodels.mk keeps a project-defined TFLITE_PATH
// (its default is a `?=`, so a value set in project.mk must win). This is a
// content check on the generated make files, so it stays hand-written next to the
// harness call rather than being pushed into the shared suite.
describe("MSDK Single Core TFLM Tests - TFLITE_PATH precedence", () => {
  it("Should retain a project-defined TFLITE_PATH for the CM4 core when aimodels.mk is included", async () => {
    const genericPlugin = new GenericPlugin(pluginInfo);
    const socInfo = pluginInfo.supportedSocs.find(
      (s) => s.name === "MAX32690" && s.board === "EvKit_V1",
    );

    if (!socInfo) {
      expect.fail(
        'No supportedSocs entry found for soc="MAX32690" board="EvKit_V1"',
      );
    }

    const cfsWorkspace: CfsWorkspace = {
      location: "tests/unit-tests/plugins/msdk-single-core-tflm/data",
      workspacePluginId: pluginInfo.pluginId,
      workspacePluginVersion: pluginInfo.pluginVersion,
      workspaceName: "tflm-precedence-test",
      copyrightDate: new Date().getFullYear().toString(),
      dataModelVersion: stripVersionRange(socInfo.dataModelVersion),
      package: socInfo.package,
      timestamp: new Date().toISOString(),
      board: socInfo.board,
      soc: socInfo.name,
      projects: [{ name: "m4", path: "./m4" }],
    };

    try {
      await genericPlugin.generateWorkspace(cfsWorkspace);

      const projectPath = joinPath(
        cfsWorkspace.location,
        cfsWorkspace.workspaceName,
        "m4",
      );

      const cfsConfigFile = joinPath(
        cfsWorkspace.location,
        cfsWorkspace.workspaceName,
        ".cfs",
        `${cfsWorkspace.soc.toLowerCase()}-${cfsWorkspace.package.toLowerCase()}.cfsconfig`,
      );
      const cfsConfig = JSON.parse(await fs.readFile(cfsConfigFile, "utf-8"));

      const project = cfsConfig.Projects.find(
        (p: any) => p.PluginId === "com.analog.project.msdk.plugin",
      );
      if (!project) {
        expect.fail(
          "No project found in cfsconfig with PluginId: com.analog.project.msdk.plugin",
        );
      }

      const socDataModel = JSON.parse(
        await fs.readFile(
          joinPath(
            "data-models",
            "socs",
            `${cfsWorkspace.soc.toLowerCase()}-${cfsWorkspace.package.toLowerCase()}.json`,
          ),
          "utf-8",
        ),
      );

      const codeGenService = new CodeGenerationService();
      await codeGenService.runCodeGeneration(
        {
          pluginId: project.PluginId,
          cfsconfig: cfsConfig,
          projectId: project.ProjectId,
          coreId: project.CoreId,
        },
        socDataModel,
        joinPath(cfsWorkspace.location, cfsWorkspace.workspaceName),
      );

      const aimodelsMkContent = await fs.readFile(
        joinPath(projectPath, "aimodels.mk"),
        "utf-8",
      );
      const projectMkContent = await fs.readFile(
        joinPath(projectPath, "project.mk"),
        "utf-8",
      );

      expect(
        aimodelsMkContent,
        "aimodels.mk must build paths from TFLITE_PATH",
      ).to.include("$(TFLITE_PATH)");

      // With an unmodified project.mk, nothing sets TFLITE_PATH before
      // aimodels.mk, so its default (`?=`) value must win.
      expect(
        resolveMakeVariable(
          [projectMkContent, aimodelsMkContent],
          "TFLITE_PATH",
        ),
      ).to.equal("$(CFSAI_PATH)/lib/cortex-m/tflite-micro");

      // Simulate a project uncommenting/editing the generated example override.
      // This must survive being combined with aimodels.mk's `?=` default, proving
      // project-defined precedence is retained.
      const customTflitePath = "/custom/tflite-micro";
      const overriddenProjectMkContent = projectMkContent.replace(
        "# TFLITE_PATH := /path/to/tflite-micro",
        `TFLITE_PATH := ${customTflitePath}`,
      );
      expect(overriddenProjectMkContent).to.not.equal(
        projectMkContent,
        "project.mk must contain the expected commented TFLITE_PATH example line",
      );
      expect(
        resolveMakeVariable(
          [overriddenProjectMkContent, aimodelsMkContent],
          "TFLITE_PATH",
        ),
      ).to.equal(customTflitePath);
    } finally {
      if (!isDebug()) {
        await deleteCreatedWorkspace(cfsWorkspace);
      }
    }
  });
});
