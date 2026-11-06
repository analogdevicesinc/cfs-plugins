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
import { joinPath } from "@utilities/path-utilities.js";
import {
  deleteCreatedWorkspace,
  getExpectedSharcFxBoardCfg,
  getSocsBoardsDict,
  isDebug,
  loadPluginInfo,
  stripVersionRange,
} from "@utilities/test-utilities.js";

const pluginInfo = await loadPluginInfo(
  "plugins/dist/sharcfx-single-core-example/.cfsplugin",
);

const supportedSocs = getSocsBoardsDict(pluginInfo);

// The ADSP-SC parts pair the FX core with a CM33; the ADSP-21xxx parts are
// FX-only. Both are generated from the same workspace, so the expected cores
// follow the SoC rather than the plugin.
const expectedSharcFxCoreIds = (soc: string): string[] =>
  soc.toLowerCase().includes("adsp-sc") ? ["CM33", "FX"] : ["FX"];

runWorkspacePluginSuite(pluginInfo, {
  suiteTitle: "SHARC-FX Single Core Hello World Tests",
  dataDir: "tests/unit-tests/plugins/sharcfx-single-core-example/data",
  core: "sfx",
  buildWorkspacePrefix: "hello",
  expectedWorkspaceFiles: [
    ".cfs/.cfsdependencies",
    ".cfs/.cfsworkspace",
    ".cfs/{{soc}}-{{package}}.cfsconfig",
    ".cfs/gdb_toolbox/configs/fault-analyzer.json",
    ".cfs/gdb_toolbox/configs/memory-dump.json",
    ".cfs/gdb_toolbox/configs/register-dump.json",
    ".cfs/gdb_toolbox/gdb/fault-analyzer-xtensa.gdb",
    ".cfs/gdb_toolbox/configs/fatal-error.json",
    ".cfs/gdb_toolbox/gdb/fatal-error-xtensa.gdb",
    "{{workspaceName}}.code-workspace",
    "sfx/.vscode/c_cpp_properties.json",
    "sfx/.vscode/cfs.tasks.json",
    "sfx/.vscode/launch.json",
    "sfx/.vscode/settings.json",
    "sfx/.vscode/gen-xt-substitute-path.sh",
    "sfx/Makefile",
    "sfx/README.md",
    "sfx/project.mk",
    "sfx/src/linker/specs",
    "sfx/src/main.c",
    "sfx/src/system/adi_initialize.c",
    "sfx/src/system/adi_initialize.h",
  ],
  codeGenByCoreId: {
    pluginId: "com.analog.project.sharcfx.plugin",
    files: {
      FX: [
        "src/system/soc_init.c",
        "src/linker/memmap.xmm",
        "aimodels.mk",
        "config.mk",
      ],
      CM33: ["src/system/soc_init.c", "memory.ld", "config.mk"],
    },
    expectedCoreIds: expectedSharcFxCoreIds,
  },
  buildArtifacts: [
    {
      project: "sfx",
      type: "executable",
      settingKey: "cfs.sfx.artifactType",
      output: (p) => `build/${p}.dxe`,
    },
    {
      project: "sfx",
      type: "static_library",
      settingKey: "cfs.sfx.artifactType",
      output: (p) => `build/lib${p}.a`,
    },
  ],
});

// Beyond the standard flow: SHARC-FX wires up artifact-type switching, flash
// and xt-run tasks through the generated VS Code files, so these are content
// checks on that output rather than file-shape checks the harness can make.
describe("SHARC-FX Single Core Hello World Tests - workspace content", () => {
  let genericPlugin: GenericPlugin;
  let cfsWorkspace: CfsWorkspace | undefined;

  beforeEach(() => {
    genericPlugin = new GenericPlugin(pluginInfo);
    cfsWorkspace = undefined;
  });

  afterEach(async () => {
    if (!isDebug() && cfsWorkspace) {
      await deleteCreatedWorkspace(cfsWorkspace);
    }
  });

  describe("GenerateWorkspace_ArtifactType_ShouldGenerateCorrectMakefile", () => {
    it("Should generate SFX Makefile with ARTIFACT_TYPE defaulting to executable", async () => {
      cfsWorkspace = {
        location: "tests/unit-tests/plugins/sharcfx-single-core-example/data",
        workspacePluginId: pluginInfo.pluginId,
        workspacePluginVersion: pluginInfo.pluginVersion,
        workspaceName: "artifact-type-makefile-test",
        copyrightDate: new Date().getFullYear().toString(),
        dataModelVersion: "1.0.0",
        package: "bga_ed",
        timestamp: new Date().toISOString(),
        board: "ADSPSC835W-EV-SOM",
        soc: "ADSP-SC835",
        projects: [{ name: "sfx", path: "./sfx" }],
      };

      await genericPlugin.generateWorkspace(cfsWorkspace);

      const makefilePath = joinPath(
        cfsWorkspace.location,
        cfsWorkspace.workspaceName,
        "sfx",
        "Makefile",
      );
      const makefileContent = await fs.readFile(makefilePath, "utf-8");

      expect(makefileContent).to.include(".DEFAULT_GOAL := all");
      expect(makefileContent).to.include("ARTIFACT_TYPE ?= executable");
      expect(makefileContent).to.include("all: link");
      expect(makefileContent).to.include(
        "check_debug: all gen-xt-substitute-path",
      );
      expect(makefileContent).to.include("gen-xt-substitute-path: all");
      expect(makefileContent).to.include("DEBUG_EXE ?= $(DXE)");
      expect(makefileContent).to.include(
        'sh .vscode/gen-xt-substitute-path.sh "$(DEBUG_EXE)" "$(SFX_PATH)"',
      );
      expect(
        await fs.readFile(
          joinPath(
            cfsWorkspace.location,
            cfsWorkspace.workspaceName,
            "sfx/.vscode/gen-xt-substitute-path.sh",
          ),
          "utf-8",
        ),
      ).to.equal(
        await fs.readFile(
          "plugins/common/sharcfx/scripts/gen-xt-substitute-path.sh",
          "utf-8",
        ),
      );
    });

    it("Should generate SFX Makefile with all artifact type dispatch targets", async () => {
      cfsWorkspace = {
        location: "tests/unit-tests/plugins/sharcfx-single-core-example/data",
        workspacePluginId: pluginInfo.pluginId,
        workspacePluginVersion: pluginInfo.pluginVersion,
        workspaceName: "artifact-type-makefile-test",
        copyrightDate: new Date().getFullYear().toString(),
        dataModelVersion: "1.0.0",
        package: "bga_ed",
        timestamp: new Date().toISOString(),
        board: "ADSPSC835W-EV-SOM",
        soc: "ADSP-SC835",
        projects: [{ name: "sfx", path: "./sfx" }],
      };

      await genericPlugin.generateWorkspace(cfsWorkspace);

      const makefilePath = joinPath(
        cfsWorkspace.location,
        cfsWorkspace.workspaceName,
        "sfx",
        "Makefile",
      );
      const makefileContent = await fs.readFile(makefilePath, "utf-8");

      expect(makefileContent).to.include(
        "ifeq ($(ARTIFACT_TYPE),static_library)",
      );
      expect(makefileContent).to.include("all: $(LIB)");
      expect(makefileContent).to.include("all: link");
    });
  });

  describe("GenerateWorkspace_ArtifactType_ShouldGenerateCorrectSettings", () => {
    it("Should include cfs.sfx.artifactType in SFX settings", async () => {
      cfsWorkspace = {
        location: "tests/unit-tests/plugins/sharcfx-single-core-example/data",
        workspacePluginId: pluginInfo.pluginId,
        workspacePluginVersion: pluginInfo.pluginVersion,
        workspaceName: "artifact-type-settings-test",
        copyrightDate: new Date().getFullYear().toString(),
        dataModelVersion: "1.0.0",
        package: "bga_ed",
        timestamp: new Date().toISOString(),
        board: "ADSPSC835W-EV-SOM",
        soc: "ADSP-SC835",
        projects: [{ name: "sfx", path: "./sfx" }],
      };

      await genericPlugin.generateWorkspace(cfsWorkspace);

      const settingsPath = joinPath(
        cfsWorkspace.location,
        cfsWorkspace.workspaceName,
        "sfx",
        ".vscode/settings.json",
      );
      const settings = JSON.parse(await fs.readFile(settingsPath, "utf-8"));

      expect(settings["cfs.sfx.artifactType"]).to.equal("executable");
    });
  });

  describe("GenerateWorkspace_ArtifactType_ShouldPassToMakeCommands", () => {
    it("Should pass ARTIFACT_TYPE to SFX build task", async () => {
      cfsWorkspace = {
        location: "tests/unit-tests/plugins/sharcfx-single-core-example/data",
        workspacePluginId: pluginInfo.pluginId,
        workspacePluginVersion: pluginInfo.pluginVersion,
        workspaceName: "artifact-type-tasks-test",
        copyrightDate: new Date().getFullYear().toString(),
        dataModelVersion: "1.0.0",
        package: "bga_ed",
        timestamp: new Date().toISOString(),
        board: "ADSPSC835W-EV-SOM",
        soc: "ADSP-SC835",
        projects: [{ name: "sfx", path: "./sfx" }],
      };

      await genericPlugin.generateWorkspace(cfsWorkspace);

      const tasksJsonPath = joinPath(
        cfsWorkspace.location,
        cfsWorkspace.workspaceName,
        "sfx",
        ".vscode/cfs.tasks.json",
      );
      const tasksJson = JSON.parse(await fs.readFile(tasksJsonPath, "utf-8"));

      const buildTask = tasksJson.tasks.find(
        (task: { label: string }) => task.label === "build",
      );
      expect(buildTask, "build task should exist in SFX tasks").to.exist;
      expect(buildTask.command).to.include(
        "ARTIFACT_TYPE=${config:cfs.sfx.artifactType}",
      );
      const debugCheckTask = tasksJson.tasks.find(
        (task: { label: string }) => task.label === "debug: check",
      );
      expect(debugCheckTask.command).to.include(
        'DEBUG_EXE="${config:cfs.programFile}"',
      );
    });
  });

  describe("GenerateWorkspace_LinuxSupport_ShouldHaveCorrectPlatformSettings", () => {
    it("Should generate launch.json with OS-specific debugger sequences", async () => {
      cfsWorkspace = {
        location: "tests/unit-tests/plugins/sharcfx-single-core-example/data",
        workspacePluginId: pluginInfo.pluginId,
        workspacePluginVersion: pluginInfo.pluginVersion,
        workspaceName: "linux-support-test",
        copyrightDate: new Date().getFullYear().toString(),
        dataModelVersion: "1.0.0",
        package: "bga_ed",
        timestamp: new Date().toISOString(),
        board: "ADSPSC835W-EV-SOM",
        soc: "ADSP-SC835",
        projects: [{ name: "sfx", path: "./sfx" }],
      };

      await genericPlugin.generateWorkspace(cfsWorkspace);

      const launchJsonPath = joinPath(
        cfsWorkspace.location,
        cfsWorkspace.workspaceName,
        "sfx",
        ".vscode/launch.json",
      );

      const launchContent = await fs.readFile(launchJsonPath, "utf-8");
      const launchJson = JSON.parse(launchContent);

      const config = launchJson.configurations[0];

      expect(
        (config as { overrideLaunchCommands: string[] }).overrideLaunchCommands,
      ).to.deep.equal(["load"]);
      // SC83x needs two GDB ports, without disabling an M33 target by name.
      expect(
        (config as { openOCDLaunchCommands: string[] }).openOCDLaunchCommands,
      ).to.deep.equal(["adapter speed 23000"]);
      expect(
        (config as { numberOfProcessors: number }).numberOfProcessors,
      ).to.equal(2);

      expect(config.windows).to.exist;
      expect(config.windows.gdbPath).to.include("xt-gdb.exe");

      const windowsPreLaunchCommands = (
        config as { windows: { preLaunchCommands: string[] } }
      ).windows.preLaunchCommands;
      expect(windowsPreLaunchCommands[4]).to.equal(
        "source .vscode/.xt-substitute-path.gdb",
      );
      expect(windowsPreLaunchCommands.slice(5)).to.deep.equal([
        "monitor reset halt",
        "load ${cfs:tool.path.xtensa-sharcfx}/Xtensa/SHARC-FX/ldr/ADSPSC835W-EV-SOM_preload_core1.dxe",
        "continue",
        'shell ${config:cfs.sdk.path}/Tools/python/python -c "import time; time.sleep(2)"',
        "interrupt",
      ]);

      const windowsPythonCmd = config.windows.preLaunchCommands.find(
        (cmd: string) => cmd.includes("python"),
      );
      expect(windowsPythonCmd).to.include("Tools/python/python");

      expect(config.linux).to.exist;
      expect(config.linux.gdbPath).to.include("xt-gdb");
      expect(config.linux.gdbPath).to.not.include(".exe");

      const linuxPreLaunchCommands = (
        config as { linux: { preLaunchCommands: string[] } }
      ).linux.preLaunchCommands;
      expect(linuxPreLaunchCommands[4]).to.equal(
        "source .vscode/.xt-substitute-path.gdb",
      );
      expect(linuxPreLaunchCommands.slice(5)).to.deep.equal([
        "monitor reset halt",
        "load ${cfs:tool.path.xtensa-sharcfx}/Xtensa/SHARC-FX/ldr/ADSPSC835W-EV-SOM_preload_core1.dxe",
        "continue",
        'shell ${config:cfs.sdk.path}/Tools/python/bin/python -c "import time; time.sleep(2)"',
        "interrupt",
      ]);

      const linuxPythonCmd = config.linux.preLaunchCommands.find(
        (cmd: string) => cmd.includes("python"),
      );
      expect(linuxPythonCmd).to.include("Tools/python/bin/python");
    });

    it("Should reserve one processor and omit target commands for ADSP-21834", async () => {
      cfsWorkspace = {
        location: "tests/unit-tests/plugins/sharcfx-single-core-example/data",
        workspacePluginId: pluginInfo.pluginId,
        workspacePluginVersion: pluginInfo.pluginVersion,
        workspaceName: "adsp-21834-launch-test",
        copyrightDate: new Date().getFullYear().toString(),
        dataModelVersion: "1.0.0",
        package: "bga_ed",
        timestamp: new Date().toISOString(),
        board: "ADSP21835W-EV-SOM",
        soc: "ADSP-21834",
        projects: [{ name: "sfx", path: "./sfx" }],
      };

      await genericPlugin.generateWorkspace(cfsWorkspace);

      const launchJsonPath = joinPath(
        cfsWorkspace.location,
        cfsWorkspace.workspaceName,
        "sfx",
        ".vscode/launch.json",
      );
      const launchContent = await fs.readFile(launchJsonPath, "utf-8");
      const launchJson = JSON.parse(launchContent) as {
        configurations: {
          openOCDLaunchCommands: string[];
          numberOfProcessors: number;
        }[];
      };

      // 2183x has no M33: reserve only SHARC-FX's GDB port and emit no target-specific commands.
      expect(launchJson.configurations[0].numberOfProcessors).to.equal(1);
      expect(launchJson.configurations[0].openOCDLaunchCommands).to.deep.equal([
        "adapter speed 23000",
      ]);
    });

    it("Should generate tasks.json with Windows and Linux environment settings", async () => {
      cfsWorkspace = {
        location: "tests/unit-tests/plugins/sharcfx-single-core-example/data",
        workspacePluginId: pluginInfo.pluginId,
        workspacePluginVersion: pluginInfo.pluginVersion,
        workspaceName: "linux-support-test",
        copyrightDate: new Date().getFullYear().toString(),
        dataModelVersion: "1.0.0",
        package: "bga_ed",
        timestamp: new Date().toISOString(),
        board: "ADSPSC835W-EV-SOM",
        soc: "ADSP-SC835",
        projects: [{ name: "sfx", path: "./sfx" }],
      };

      await genericPlugin.generateWorkspace(cfsWorkspace);

      const tasksJsonPath = joinPath(
        cfsWorkspace.location,
        cfsWorkspace.workspaceName,
        "sfx",
        ".vscode/cfs.tasks.json",
      );

      const tasksContent = await fs.readFile(tasksJsonPath, "utf-8");
      const tasksJson = JSON.parse(tasksContent);

      const buildTask = tasksJson.tasks[0];

      expect(buildTask.windows).to.exist;
      expect(buildTask.windows.options.env.PATH).to.include(";");
      expect(buildTask.windows.options.env.SHELL).to.equal("sh.exe");
      expect(buildTask.windows.options.shell.executable).to.include("cmd.exe");
      expect(buildTask.windows.options.shell.args).to.deep.equal(["/c"]);

      expect(buildTask.linux).to.exist;
      expect(buildTask.linux.options.env.PATH).to.not.include(";");
      expect(buildTask.linux.options.env.PATH).to.include("xtensa-sharcfx");
      expect(buildTask.linux.options.env.SHELL).to.equal("/bin/sh");
      expect(buildTask.linux.options.shell).to.not.exist;
    });

    it("Should generate c_cpp_properties.json with Default configuration", async () => {
      cfsWorkspace = {
        location: "tests/unit-tests/plugins/sharcfx-single-core-example/data",
        workspacePluginId: pluginInfo.pluginId,
        workspacePluginVersion: pluginInfo.pluginVersion,
        workspaceName: "linux-support-test",
        copyrightDate: new Date().getFullYear().toString(),
        dataModelVersion: "1.0.0",
        package: "bga_ed",
        timestamp: new Date().toISOString(),
        board: "ADSPSC835W-EV-SOM",
        soc: "ADSP-SC835",
        projects: [{ name: "sfx", path: "./sfx" }],
      };

      await genericPlugin.generateWorkspace(cfsWorkspace);

      const cppPropsPath = joinPath(
        cfsWorkspace.location,
        cfsWorkspace.workspaceName,
        "sfx",
        ".vscode/c_cpp_properties.json",
      );

      const propsContent = await fs.readFile(cppPropsPath, "utf-8");
      const propsJson = JSON.parse(propsContent);

      expect(propsJson.configurations).to.be.an("array");

      for (const config of propsJson.configurations) {
        expect(config.compilerPath).to.equal(
          "${env:cfs.project.toolchain.path}/ccfx++",
        );
        expect(config.intelliSenseMode).to.equal("clang-arm64");
        expect(config.includePath.length).to.be.greaterThan(1);
      }
    });
  });

  describe("GenerateWorkspace_FlashTask_ShouldHaveCorrectConfiguration", () => {
    Object.entries(supportedSocs).forEach(([soc, boards]) => {
      boards.forEach((board) => {
        it(`Using ${soc} SoC with ${board} board`, async () => {
          const socInfo = pluginInfo.supportedSocs.find(
            (s) => s.name === soc && s.board === board,
          );

          if (!socInfo) {
            expect.fail(
              `No supportedSocs entry found for soc="${soc}" board="${board}"`,
            );
          }

          cfsWorkspace = {
            location:
              "tests/unit-tests/plugins/sharcfx-single-core-example/data",
            workspacePluginId: pluginInfo.pluginId,
            workspacePluginVersion: pluginInfo.pluginVersion,
            workspaceName: `${soc.toLowerCase()}-${board.toLowerCase()}-flash-test`,
            copyrightDate: new Date().getFullYear().toString(),
            dataModelVersion: stripVersionRange(socInfo.dataModelVersion),
            package: socInfo.package.toLowerCase(),
            timestamp: new Date().toISOString(),
            board: board,
            soc: soc,
            projects: [{ name: "sfx", path: "./sfx" }],
          };

          await genericPlugin.generateWorkspace(cfsWorkspace);

          const tasksJsonPath = joinPath(
            cfsWorkspace.location,
            cfsWorkspace.workspaceName,
            "sfx",
            ".vscode/cfs.tasks.json",
          );
          const tasksContent = await fs.readFile(tasksJsonPath, "utf-8");
          const tasksJson = JSON.parse(tasksContent);

          const flashTask = tasksJson.tasks.find(
            (task: { label: string }) => task.label === "flash",
          );
          const eraseTask = tasksJson.tasks.find(
            (task: { label: string }) => task.label === "erase",
          );
          expect(flashTask, "flash task should exist").to.exist;
          expect(eraseTask, "erase task should exist").to.exist;

          expect(flashTask.command).to.include("elfloader");
          expect(flashTask.command).to.include("cldp");
          expect(flashTask.command).to.include("-bspi -fbinary -bcode 1");
          expect(flashTask.command).to.include(
            "${cfs:tool.path.xtensa-sharcfx}/elfloader",
          );
          expect(flashTask.command).to.include(
            "${cfs:tool.path.xtensa-sharcfx}/cldp",
          );
          expect(flashTask.command).to.include(`-proc ${soc}`);
          expect(flashTask.command).to.include("-si-revision any");
          expect(flashTask.command).to.include(
            "-emu ${config:cfs.sfx.flash.emulator}",
          );
          expect(flashTask.command).to.include(
            "flash_algorithms/2183x_flash.dxe",
          );
          const expectedBoardCfg = getExpectedSharcFxBoardCfg(soc, board);

          expect(flashTask.command).to.include(
            `\${cfs:tool.path.xtensa-sharcfx}/cldp -proc ${soc} ` +
              "-emu ${config:cfs.sfx.flash.emulator} " +
              '-driver "${config:cfs.sdk.path}/Tools/openocd/share/openocd/scripts/board/flash_algorithms/2183x_flash.dxe" ' +
              `-board ${expectedBoardCfg} ` +
              '-openocdroot "${config:cfs.sdk.path}/Tools/openocd" ' +
              "-verbose -cmd prog " +
              '-file "${workspaceFolder}/build/${workspaceFolderBasename}_Core1.ldr" ' +
              "-format bin " +
              "-erase ${config:cfs.sfx.flash.eraseMode} " +
              "-offset ${config:cfs.sfx.flash.offset}",
          );

          const settingsJsonPath = joinPath(
            cfsWorkspace.location,
            cfsWorkspace.workspaceName,
            "sfx",
            ".vscode/settings.json",
          );
          const settingsContent = await fs.readFile(settingsJsonPath, "utf-8");
          const settings = JSON.parse(settingsContent);

          expect(settings["cfs.sfx.flash.eraseMode"]).to.equal("affected");
          expect(settings["cfs.sfx.flash.emulator"]).to.equal("2000");
          expect(settings["cfs.sfx.flash.offset"]).to.equal("0x0");
          expect(flashTask.command).to.include(`-board ${expectedBoardCfg}`);
          expect(eraseTask.command).to.include("cldp");
          expect(eraseTask.command).to.include(`-proc ${soc}`);
          expect(eraseTask.command).to.include("-cmd erase");
          expect(eraseTask.command).to.not.include("-cmd erase -erase all");
          expect(eraseTask.command).to.include(
            "-emu ${config:cfs.sfx.flash.emulator}",
          );
          expect(eraseTask.command).to.include(`-board ${expectedBoardCfg}`);
          expect(eraseTask.command).to.include(
            `\${cfs:tool.path.xtensa-sharcfx}/cldp -proc ${soc} ` +
              "-emu ${config:cfs.sfx.flash.emulator} " +
              '-driver "${config:cfs.sdk.path}/Tools/openocd/share/openocd/scripts/board/flash_algorithms/2183x_flash.dxe" ' +
              `-board ${expectedBoardCfg} ` +
              '-openocdroot "${config:cfs.sdk.path}/Tools/openocd" ' +
              "-verbose -cmd erase",
          );
          expect(flashTask.command).to.include(
            "${workspaceFolder}/build/${workspaceFolderBasename}_Core1.ldr",
          );
          expect(flashTask.command).to.include(
            "${workspaceFolder}/build/${workspaceFolderBasename}.dxe",
          );
        });
      });
    });
  });

  describe("GenerateWorkspace_XtRunSupport_ShouldHaveSimulatorConfiguration", () => {
    it("Should generate launch.json with a wired-up xt-run (Simulator) configuration", async () => {
      cfsWorkspace = {
        location: "tests/unit-tests/plugins/sharcfx-single-core-example/data",
        workspacePluginId: pluginInfo.pluginId,
        workspacePluginVersion: pluginInfo.pluginVersion,
        workspaceName: "xt-run-support-test",
        copyrightDate: new Date().getFullYear().toString(),
        dataModelVersion: "1.0.0",
        package: "bga_ed",
        timestamp: new Date().toISOString(),
        board: "ADSPSC835W-EV-SOM",
        soc: "ADSP-SC835",
        projects: [{ name: "sfx", path: "./sfx" }],
      };

      await genericPlugin.generateWorkspace(cfsWorkspace);

      const launchJsonPath = joinPath(
        cfsWorkspace.location,
        cfsWorkspace.workspaceName,
        "sfx",
        ".vscode/launch.json",
      );

      const launchContent = await fs.readFile(launchJsonPath, "utf-8");
      const launchJson = JSON.parse(launchContent);

      const xtRunConfig = launchJson.configurations.find(
        (config: { name: string }) =>
          config.name === "Debug with GDB and xt-run (Simulator)",
      );
      expect(xtRunConfig).to.exist;

      expect(xtRunConfig.type).to.equal("cppdbg");
      expect(xtRunConfig.MIMode).to.equal("gdb");
      expect(xtRunConfig.miDebuggerPath).to.include("xt-gdb");
      expect(xtRunConfig.miDebuggerPath).to.not.include(".exe");
      expect(xtRunConfig.windows.miDebuggerPath).to.include("xt-gdb.exe");
      expect(xtRunConfig).to.not.have.property("sourceFileMap");

      expect(xtRunConfig.preLaunchTask).to.equal(
        "CFS: xt-run: start gdbserver",
      );
      expect(xtRunConfig.postDebugTask).to.equal("CFS: xt-run: stop gdbserver");

      const connectCommand = xtRunConfig.customLaunchSetupCommands.find(
        (cmd: { text: string }) => cmd.text.includes(".xt-run-connect.gdb"),
      );
      expect(connectCommand).to.exist;

      const substituteCommand = xtRunConfig.customLaunchSetupCommands.find(
        (cmd: { text: string }) => cmd.text.includes(".xt-substitute-path.gdb"),
      );
      expect(substituteCommand).to.deep.equal({
        text: "source ${workspaceFolder}/.vscode/.xt-substitute-path.gdb",
        description:
          "Resolve XtensaTools runtime sources regardless of the installed toolchain release",
        ignoreFailures: false,
      });

      const symbolsCommand = xtRunConfig.customLaunchSetupCommands.find(
        (cmd: { text: string }) => cmd.text.includes("-file-exec-and-symbols"),
      );
      expect(
        xtRunConfig.customLaunchSetupCommands.indexOf(substituteCommand),
      ).to.be.lessThan(
        xtRunConfig.customLaunchSetupCommands.indexOf(symbolsCommand),
      );
      expect(symbolsCommand.text).to.include("${config:cfs.programFile}");

      expect(xtRunConfig.launchCompleteCommand).to.equal("exec-continue");
    });

    it("Should generate cfs.tasks.json with wired-up xt-run gdbserver/tail tasks", async () => {
      cfsWorkspace = {
        location: "tests/unit-tests/plugins/sharcfx-single-core-example/data",
        workspacePluginId: pluginInfo.pluginId,
        workspacePluginVersion: pluginInfo.pluginVersion,
        workspaceName: "xt-run-support-test",
        copyrightDate: new Date().getFullYear().toString(),
        dataModelVersion: "1.0.0",
        package: "bga_ed",
        timestamp: new Date().toISOString(),
        board: "ADSPSC835W-EV-SOM",
        soc: "ADSP-SC835",
        projects: [{ name: "sfx", path: "./sfx" }],
      };

      await genericPlugin.generateWorkspace(cfsWorkspace);

      const tasksJsonPath = joinPath(
        cfsWorkspace.location,
        cfsWorkspace.workspaceName,
        "sfx",
        ".vscode/cfs.tasks.json",
      );

      const tasksContent = await fs.readFile(tasksJsonPath, "utf-8");
      const tasksJson = JSON.parse(tasksContent);

      const taskLabels = tasksJson.tasks.map(
        (task: { label: string }) => task.label,
      );
      expect(taskLabels).to.include.members([
        "xt-run: start gdbserver",
        "xt-run: stop gdbserver",
        "xt-run: tail stdout",
      ]);

      const startTask = tasksJson.tasks.find(
        (task: { label: string }) => task.label === "xt-run: start gdbserver",
      );
      expect(startTask.command).to.include(
        "make -r -j 8 --output-sync=target --no-print-directory check_debug",
      );
      expect(startTask.command).to.include(
        "ARTIFACT_TYPE=${config:cfs.sfx.artifactType}",
      );
      expect(startTask.command).to.include(
        "${cfs:tool.path.xtensa-sharcfx}/adi_xt-run",
      );
      expect(startTask.command.indexOf("check_debug")).to.be.lessThan(
        startTask.command.indexOf("adi_xt-run"),
      );
      expect(startTask.args).to.include("${config:cfs.programFile}");

      const stopTask = tasksJson.tasks.find(
        (task: { label: string }) => task.label === "xt-run: stop gdbserver",
      );
      expect(stopTask.command).to.equal(
        "${cfs:tool.path.xtensa-sharcfx}/adi_xt-run",
      );
      expect(stopTask.args).to.include("--stop-only");
      expect(stopTask.args).to.deep.equal(["--stop-only"]);

      const tailTask = tasksJson.tasks.find(
        (task: { label: string }) => task.label === "xt-run: tail stdout",
      );
      expect(tailTask.isBackground).to.equal(true);
      expect(tailTask.windows.command).to.equal("powershell");
      expect(tailTask.windows.args).to.include(
        "${workspaceFolder}/.vscode/tail-xt-run-stdout.ps1",
      );
    });
  });
});
