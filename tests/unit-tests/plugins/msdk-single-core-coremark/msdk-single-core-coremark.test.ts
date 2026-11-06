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
  "plugins/dist/msdk-single-core-coremark/.cfsplugin",
);

runWorkspacePluginSuite(pluginInfo, {
  suiteTitle: "MSDK Single Core Coremark Tests",
  dataDir: "tests/unit-tests/plugins/msdk-single-core-coremark/data",
  core: "m4",
  projects: [{ name: "m4", path: "./m4" }],
  projectPluginId: "com.analog.project.msdk.plugin",
  buildWorkspacePrefix: "coremark",
  buildable: true,
  expectedWorkspaceFiles: [
    "m4/.vscode/launch.json",
    "m4/.vscode/flash.gdb",
    "m4/README.md",
    "m4/COREMARK_README.md",
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
    "m4/src/core_portme.c",
    "m4/src/core_portme.h",
    "m4/project.mk",
    "m4/Makefile",
    "m4/.vscode/c_cpp_properties.json",
    "m4/m4.jdebug",
    "m4/.vscode/cfs.tasks.json",
    "{{soc}}-{{board}}-workspace-gen.code-workspace",
    ".cfs/{{soc}}-{{package}}.cfsconfig",
  ],
  expectedCodeGenFiles: ["soc_init.c", "soc_init.h", "config.mk", "memory.ld"],
});
