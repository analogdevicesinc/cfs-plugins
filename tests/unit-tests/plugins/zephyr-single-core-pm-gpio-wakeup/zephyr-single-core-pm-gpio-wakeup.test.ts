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
import {
  loadPluginInfo,
  zephyrBoardCodeGenFiles,
  zephyrCoreDir,
} from "@utilities/test-utilities.js";

const pluginInfo = await loadPluginInfo(
  "plugins/dist/zephyr-single-core-pm-gpio-wakeup/.cfsplugin",
);

runWorkspacePluginSuite(pluginInfo, {
  suiteTitle: "Unit test for Zephyr Single Core PM GPIO Wakeup",
  dataDir: "tests/unit-tests/plugins/zephyr-single-core-pm-gpio-wakeup/data",
  core: zephyrCoreDir,
  projectPluginId: "com.analog.project.zephyr.plugin",
  buildWorkspacePrefix: "pm-gpio-wakeup",
  buildable: true,
  expectedWorkspaceFiles: [
    "{{core}}/.vscode/c_cpp_properties.json",
    "{{core}}/CMakeLists.txt",
    "{{core}}/README.rst",
    "{{core}}/.vscode/settings.json",
    "{{core}}/prj.conf",
    "{{core}}/src/main.c",
    "{{core}}/.vscode/launch.json",
    "{{core}}/{{core}}.jdebug",
    "{{core}}/boards/pm_gpio_wakeup.overlay",
    ".cfs/gdb_toolbox/configs/fault-analyzer.json",
    ".cfs/gdb_toolbox/configs/memory-dump.json",
    ".cfs/gdb_toolbox/configs/register-dump.json",
    ".cfs/gdb_toolbox/configs/thread-analyzer.json",
    ".cfs/gdb_toolbox/configs/crash-cause-zephyr.json",
    ".cfs/gdb_toolbox/configs/heap-analyzer.json",
    ".cfs/gdb_toolbox/gdb/fault-analyzer-arm.gdb",
    ".cfs/gdb_toolbox/gdb/thread-analyzer.gdb",
    ".cfs/gdb_toolbox/gdb/crash-cause-zephyr.gdb",
    ".cfs/gdb_toolbox/gdb/heap-analyzer.gdb",
    ".cfs/.cfsdependencies",
    ".cfs/.cfsworkspace",
    "{{soc}}-{{board}}-workspace-gen.code-workspace",
    ".cfs/{{soc}}-{{package}}.cfsconfig",
  ],
  expectedCodeGenFiles: zephyrBoardCodeGenFiles,
});
