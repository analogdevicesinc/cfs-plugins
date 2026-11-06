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
} from "@utilities/test-utilities.js";

const pluginInfo = await loadPluginInfo(
  "plugins/dist/zephyr-tfm-secure-partition/.cfsplugin",
);

const MSDK = "com.analog.project.msdk.plugin";
const ZEPHYR = "com.analog.project.zephyr.plugin";

const expectedWorkspaceFiles = [
  "m33/.vscode/launch.json",
  "m33/.vscode/c_cpp_properties.json",
  "m33/src/main.c",
  "m33/src/dummy_partition.c",
  "m33/dummy_partition/CMakeLists.txt",
  "m33/dummy_partition/dummy_partition.c",
  "m33/dummy_partition/tfm_dummy_partition.yaml",
  "m33/dummy_partition/tfm_manifest_list.yaml.in",
  "m33/src/dummy_partition.h",
  "m33/CMakeLists.txt",
  "m33/prj.conf",
  "m33/README.rst",
  ".cfs/gdb_toolbox/configs/fault-analyzer.json",
  ".cfs/gdb_toolbox/configs/memory-dump.json",
  ".cfs/gdb_toolbox/configs/register-dump.json",
  ".cfs/gdb_toolbox/configs/thread-analyzer.json",
  ".cfs/gdb_toolbox/configs/crash-cause-zephyr.json",
  ".cfs/gdb_toolbox/gdb/fault-analyzer-arm.gdb",
  ".cfs/gdb_toolbox/gdb/thread-analyzer.gdb",
  ".cfs/gdb_toolbox/gdb/crash-cause-zephyr.gdb",
  ".cfs/.cfsdependencies",
  ".cfs/.cfsworkspace",
  "m33/.vscode/settings.json",
  "m33/.vscode/tasks.json",
  "m33/m33.jdebug",
  "{{soc}}-{{board}}-workspace-gen.code-workspace",
  ".cfs/{{soc}}-{{package}}.cfsconfig",
];

runWorkspacePluginSuite(pluginInfo, {
  suiteTitle: "Zephyr TFM Secure Partition Tests",
  dataDir: "tests/unit-tests/plugins/zephyr-tfm-secure-partition/data",
  projects: [{ name: "m33", path: "./m33" }],
  buildWorkspacePrefix: "tfm",
  buildable: true,
  expectedWorkspaceFiles,
  // TF-M mixes two project plugins in one m33 folder: the secure MSDK project
  // and the non-secure Zephyr project. Each is looked up by ProjectId + pluginId.
  codeGenProjects: [
    {
      projectId: "CM33 Secure",
      pluginId: MSDK,
      files: [
        "adi_soc_peripheral_init.c",
        "adi_soc_peripheral_init.h",
        "s_ns_access_overlay.cmake",
      ],
    },
    {
      projectId: "CM33 Non-Secure",
      pluginId: ZEPHYR,
      files: (project) => zephyrBoardCodeGenFiles(project),
    },
  ],
});
