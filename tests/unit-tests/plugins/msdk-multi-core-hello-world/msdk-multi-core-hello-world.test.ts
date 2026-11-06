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
  "plugins/dist/msdk-multi-core-hello-world/.cfsplugin",
);

const MSDK = "com.analog.project.msdk.plugin";
const coreCodeGenFiles = ["soc_init.c", "soc_init.h", "config.mk", "memory.ld"];

// Files common to every SoC; the RISC-V launch config is added below for every
// SoC except MAX32690, which does not generate it.
const commonWorkspaceFiles = [
  "m4/.vscode/launch.json",
  "m4/.vscode/flash.gdb",
  "m4/README.md",
  "m4/.vscode/settings.json",
  "m4/src/main.c",
  "m4/.vscode/c_cpp_properties.json",
  "m4/project.mk",
  "m4/Makefile",
  "m4/.vscode/cfs.tasks.json",
  "m4/m4.jdebug",
  "riscv/.vscode/flash.gdb",
  "riscv/README.md",
  "riscv/.vscode/settings.json",
  "riscv/.vscode/c_cpp_properties.json",
  "riscv/src/main.c",
  "riscv/project.mk",
  "riscv/Makefile",
  "riscv/.vscode/cfs.tasks.json",
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
  suiteTitle: "MSDK Multi Core Hello World Tests",
  dataDir: "tests/unit-tests/plugins/msdk-multi-core-hello-world/data",
  projects: [
    { name: "m4", path: "./m4" },
    { name: "riscv", path: "./riscv" },
  ],
  buildWorkspacePrefix: "hello_world",
  buildable: true,
  expectedWorkspaceFiles: ({ soc }) =>
    soc.toLowerCase() !== "max32690"
      ? [...commonWorkspaceFiles, "riscv/.vscode/launch.json"]
      : commonWorkspaceFiles,
  codeGenProjects: [
    { projectId: "CM4", pluginId: MSDK, files: coreCodeGenFiles },
    { projectId: "RV", pluginId: MSDK, files: coreCodeGenFiles },
  ],
});
