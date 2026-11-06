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

import { runWorkspacePluginSuite } from "@services/WorkspacePluginSuite.js";
import { loadPluginInfo } from "@utilities/test-utilities.js";

const pluginInfo = await loadPluginInfo(
  "plugins/dist/msdk-multi-core-hello-world-single-exe/.cfsplugin",
);

const MSDK = "com.analog.project.msdk.plugin";

const expectedWorkspaceFiles = [
  "m4-0/src/main.c",
  "m4-0/project.mk",
  "m4-0/.vscode/launch.json",
  "m4-0/.vscode/flash.gdb",
  "m4-0/README.md",
  "m4-0/.vscode/settings.json",
  "m4-0/.vscode/c_cpp_properties.json",
  "m4-0/Makefile",
  "m4-0/.vscode/cfs.tasks.json",
  "m4-0/m4-0.jdebug",
  "m4-1/src/main_core1.c",
  "m4-1/.vscode/c_cpp_properties.json",
  ".cfs/gdb_toolbox/configs/fault-analyzer.json",
  ".cfs/gdb_toolbox/configs/memory-dump.json",
  ".cfs/gdb_toolbox/configs/register-dump.json",
  ".cfs/gdb_toolbox/configs/interrupt-status-arm.json",
  ".cfs/gdb_toolbox/configs/high-water-analyzer.json",
  ".cfs/gdb_toolbox/configs/stack-analyzer.json",
  ".cfs/gdb_toolbox/configs/stack-painter.json",
  ".cfs/gdb_toolbox/gdb/fault-analyzer-arm.gdb",
  ".cfs/gdb_toolbox/gdb/fault-analyzer-riscv.gdb",
  ".cfs/gdb_toolbox/gdb/interrupt-status-arm.gdb",
  ".cfs/gdb_toolbox/gdb/high-water-analyzer.gdb",
  ".cfs/gdb_toolbox/gdb/stack-analyzer.gdb",
  ".cfs/gdb_toolbox/gdb/stack-painter.gdb",
  ".cfs/.cfsdependencies",
  ".cfs/.cfsworkspace",
  "{{soc}}-{{board}}-workspace-gen.code-workspace",
  ".cfs/{{soc}}-{{package}}.cfsconfig",
];

runWorkspacePluginSuite(pluginInfo, {
  suiteTitle: "MSDK Multi Core Hello World Single Exe Tests",
  dataDir:
    "tests/unit-tests/plugins/msdk-multi-core-hello-world-single-exe/data",
  projects: [
    { name: "m4-0", path: "./m4-0" },
    { name: "m4-1", path: "./m4-1" },
  ],
  buildWorkspacePrefix: "single_exe",
  buildable: true,
  expectedWorkspaceFiles,
  // CM4-1 is the secondary core in a single-executable build; it only
  // receives the core1 SoC init sources.
  codeGenProjects: [
    {
      projectId: "CM4-0",
      pluginId: MSDK,
      files: ["soc_init.c", "soc_init.h", "config.mk", "memory.ld"],
    },
    {
      projectId: "CM4-1",
      pluginId: MSDK,
      files: ["soc_init_core1.c", "soc_init_core1.h"],
    },
  ],
});
