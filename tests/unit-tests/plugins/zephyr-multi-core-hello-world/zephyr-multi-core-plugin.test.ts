/**
 *
 * Copyright (c) 2026 Analog Devices, Inc.
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
import { joinPath } from "@utilities/path-utilities.js";
import {
  deleteCreatedWorkspace,
  isDebug,
  loadPluginInfo,
  zephyrBoardCodeGenFiles,
} from "@utilities/test-utilities.js";

const pluginInfo = await loadPluginInfo(
  "plugins/dist/zephyr-multi-core-hello-world/.cfsplugin",
);

const ZEPHYR = "com.analog.project.zephyr.plugin";

// Complete expected workspace tree; a file removed from the manifest makes
// validateWorkspaceFiles fail (missing), and a stray file fails it (unexpected).
const commonWorkspaceFiles = [
  ".cfs/.cfsdependencies",
  ".cfs/.cfsworkspace",
  ".cfs/{{soc}}-{{package}}.cfsconfig",
  ".cfs/gdb_toolbox/configs/fault-analyzer.json",
  ".cfs/gdb_toolbox/configs/memory-dump.json",
  ".cfs/gdb_toolbox/configs/register-dump.json",
  ".cfs/gdb_toolbox/configs/thread-analyzer.json",
  ".cfs/gdb_toolbox/configs/crash-cause-zephyr.json",
  ".cfs/gdb_toolbox/configs/heap-analyzer.json",
  ".cfs/gdb_toolbox/gdb/fault-analyzer-arm.gdb",
  ".cfs/gdb_toolbox/gdb/fault-analyzer-riscv.gdb",
  ".cfs/gdb_toolbox/gdb/thread-analyzer.gdb",
  ".cfs/gdb_toolbox/gdb/crash-cause-zephyr.gdb",
  ".cfs/gdb_toolbox/gdb/heap-analyzer.gdb",
  "{{workspaceName}}.code-workspace",
  "m4/.vscode/c_cpp_properties.json",
  "m4/.vscode/launch.json",
  "m4/.vscode/settings.json",
  "m4/CMakeLists.txt",
  "m4/README.rst",
  "m4/app.overlay",
  "m4/prj.conf",
  "m4/src/main.c",
  "rv32/.vscode/c_cpp_properties.json",
  "rv32/.vscode/settings.json",
  "rv32/CMakeLists.txt",
  "rv32/app.overlay",
  "rv32/prj.conf",
  "rv32/src/main.c",
];

if (pluginInfo.supportedSocs.length > 0) {
  runWorkspacePluginSuite(pluginInfo, {
    suiteTitle: "Unit test for Zephyr Multi Core Hello World",
    dataDir: "tests/unit-tests/plugins/zephyr-multi-core-hello-world/data",
    projects: [
      { name: "m4", path: "./m4" },
      { name: "rv32", path: "./rv32" },
    ],
    buildable: false,
    // The RISC-V launch config is not generated for MAX32690.
    expectedWorkspaceFiles: ({ soc }) =>
      soc.toLowerCase() !== "max32690"
        ? [...commonWorkspaceFiles, "rv32/.vscode/launch.json"]
        : commonWorkspaceFiles,
    codeGenProjects: [
      {
        projectId: "CM4",
        pluginId: ZEPHYR,
        files: (project) => zephyrBoardCodeGenFiles(project),
      },
      {
        projectId: "RV",
        pluginId: ZEPHYR,
        files: (project) => zephyrBoardCodeGenFiles(project),
      },
    ],
  });
}

// Beyond the standard flow: each core must reference its own Zephyr toolchain
// and debug connection, in the workspace dependencies as well as in the
// per-core VS Code settings and launch configs.
describe("Unit test for Zephyr Multi Core Hello World - toolchains", () => {
  const dataDir = "tests/unit-tests/plugins/zephyr-multi-core-hello-world/data";

  interface DebuggerPaths {
    gdbPath?: string;
    objdumpPath?: string;
  }
  interface LaunchConfig extends DebuggerPaths {
    linux?: DebuggerPaths;
    windows?: DebuggerPaths;
    osx?: DebuggerPaths;
  }
  interface LaunchJson {
    configurations: LaunchConfig[];
  }
  interface SettingsJson {
    "cfs.project.toolchain.id"?: string;
    "cfs.openocd.interface"?: string;
    "cfs.openocd.target"?: string;
  }
  interface DependenciesJson {
    packages: { name: string }[];
  }

  const readJson = async <T>(...segments: string[]): Promise<T> =>
    JSON.parse(await fs.readFile(joinPath(...segments), "utf-8")) as T;

  // Collects every gdbPath/objdumpPath across all configurations and OSes.
  const debuggerPaths = (launch: LaunchJson): string[] =>
    launch.configurations.flatMap((config) =>
      [config, config.linux, config.windows, config.osx]
        .filter(Boolean)
        .flatMap((entry) => [entry.gdbPath, entry.objdumpPath])
        .filter((p): p is string => typeof p === "string"),
    );

  for (const socInfo of pluginInfo.supportedSocs) {
    it(`${socInfo.name} SoC with ${socInfo.board} board`, async () => {
      const cfsWorkspace: CfsWorkspace = {
        location: dataDir,
        workspacePluginId: pluginInfo.pluginId,
        workspacePluginVersion: pluginInfo.pluginVersion,
        workspaceName:
          `toolchains-${socInfo.name}-${socInfo.board}`.toLowerCase(),
        copyrightDate: new Date().getFullYear().toString(),
        dataModelVersion: socInfo.dataModelVersion,
        package: socInfo.package,
        timestamp: new Date().toISOString(),
        board: socInfo.board,
        soc: socInfo.name,
        projects: [
          { name: "m4", path: "./m4" },
          { name: "rv32", path: "./rv32" },
        ],
      };

      try {
        await new GenericPlugin(pluginInfo).generateWorkspace(cfsWorkspace);
        const root = joinPath(
          cfsWorkspace.location,
          cfsWorkspace.workspaceName,
        );

        const dependencies = await readJson<DependenciesJson>(
          root,
          ".cfs",
          ".cfsdependencies",
        );
        const packageNames = dependencies.packages.map((p) => p.name);
        expect(packageNames).to.include.members([
          "zephyr_arm_toolchain",
          "zephyr_riscv_toolchain",
        ]);

        const m4Settings = await readJson<SettingsJson>(
          root,
          "m4",
          ".vscode",
          "settings.json",
        );
        expect(m4Settings["cfs.project.toolchain.id"]).to.equal(
          "arm.zephyr.eabi.toolchain",
        );
        expect(m4Settings["cfs.openocd.interface"]).to.equal(
          "interface/cmsis-dap.cfg",
        );
        expect(m4Settings["cfs.openocd.target"]).to.match(
          /^target\/[a-z0-9]+\.cfg$/,
        );

        const rv32Settings = await readJson<SettingsJson>(
          root,
          "rv32",
          ".vscode",
          "settings.json",
        );
        expect(rv32Settings["cfs.project.toolchain.id"]).to.equal(
          "riscv.zephyr.elf.toolchain",
        );
        expect(rv32Settings["cfs.openocd.interface"]).to.equal(
          "interface/ftdi/olimex-arm-usb-ocd-h.cfg",
        );
        expect(rv32Settings["cfs.openocd.target"]).to.match(
          /^target\/[a-z0-9]+_riscv\.cfg$/,
        );

        const m4Paths = debuggerPaths(
          await readJson<LaunchJson>(root, "m4", ".vscode", "launch.json"),
        );
        expect(m4Paths).to.have.length.greaterThan(0);
        for (const p of m4Paths) {
          expect(p).to.match(
            /^\$\{cfs:tool\.path\.arm\.zephyr\.eabi\.toolchain\./,
          );
        }

        // The RISC-V launch config is not generated for MAX32690.
        if (socInfo.name.toLowerCase() !== "max32690") {
          const rv32Paths = debuggerPaths(
            await readJson<LaunchJson>(root, "rv32", ".vscode", "launch.json"),
          );
          expect(rv32Paths).to.have.length.greaterThan(0);
          for (const p of rv32Paths) {
            expect(p).to.match(
              /^\$\{cfs:tool\.path\.riscv\.zephyr\.elf\.toolchain\./,
            );
          }
        }
      } finally {
        if (!isDebug()) {
          await deleteCreatedWorkspace(cfsWorkspace);
        }
      }
    });
  }
});
