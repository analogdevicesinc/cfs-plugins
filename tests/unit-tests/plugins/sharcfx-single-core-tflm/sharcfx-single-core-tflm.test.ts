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
import type {
  CfsConfig,
  CfsSocDataModel,
  CfsWorkspace,
  ConfiguredProject,
} from "cfs-types";
import { CodeGenerationService } from "@services/CodeGenerationService.js";
import { runWorkspacePluginSuite } from "@services/WorkspacePluginSuite.js";
import { WorkspaceValidationService } from "@services/WorkspaceValidationService.js";
import { joinPath } from "@utilities/path-utilities.js";
import {
  deleteCreatedWorkspace,
  isDebug,
  loadPluginInfo,
  resolveMakeVariable,
} from "@utilities/test-utilities.js";

const pluginInfo = await loadPluginInfo(
  "plugins/dist/sharcfx-single-core-tflm/.cfsplugin",
);

// The ADSP-SC parts pair the FX core with a CM33; the ADSP-21xxx parts are
// FX-only. Both are generated from the same workspace, so the expected cores
// follow the SoC rather than the plugin.
const expectedSharcFxCoreIds = (soc: string): string[] =>
  soc.toLowerCase().includes("adsp-sc") ? ["CM33", "FX"] : ["FX"];

runWorkspacePluginSuite(pluginInfo, {
  suiteTitle: "SHARC-FX Single Core with TFLM Tests",
  dataDir: "tests/unit-tests/plugins/sharcfx-single-core-tflm/data",
  core: "sfx",
  buildWorkspacePrefix: "tflm",
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
    "sfx/hello_world_f32.tflite",
    "sfx/project.mk",
    "sfx/src/adi_micro_time.cpp",
    "sfx/src/linker/specs",
    "sfx/src/main.cpp",
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

// Beyond the standard flow: content checks on the generated VS Code files and
// the TFLM make variables, which the shared file-shape validation cannot make.
describe("SHARC-FX Single Core with TFLM Tests - workspace content", () => {
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

  describe("GenerateWorkspace_FaultAnalyzer_ShouldCoverBothArchitectures", () => {
    it("Should generate a fault-analyzer config covering the arm and xtensa architectures", async () => {
      cfsWorkspace = {
        location: "tests/unit-tests/plugins/sharcfx-single-core-tflm/data",
        workspacePluginId: pluginInfo.pluginId,
        workspacePluginVersion: pluginInfo.pluginVersion,
        workspaceName: "fault-analyzer-test",
        copyrightDate: new Date().getFullYear().toString(),
        dataModelVersion: "1.0.0",
        package: "bga_ed",
        timestamp: new Date().toISOString(),
        board: "ADSPSC835W-EV-SOM",
        soc: "ADSP-SC835",
        projects: [{ name: "sfx", path: "./sfx" }],
      };

      await genericPlugin.generateWorkspace(cfsWorkspace);

      await new WorkspaceValidationService().validateFaultAnalyzerConfig(
        cfsWorkspace,
        ["arm", "xtensa"],
      );
    });
  });

  describe("GenerateWorkspace_FlashTask_ShouldHaveCorrectConfiguration", () => {
    it("Should generate a flash task with elfloader→cldp command and build dependency", async () => {
      cfsWorkspace = {
        location: "tests/unit-tests/plugins/sharcfx-single-core-tflm/data",
        workspacePluginId: pluginInfo.pluginId,
        workspacePluginVersion: pluginInfo.pluginVersion,
        workspaceName: "flash-task-test",
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
      expect(flashTask.command).to.include("-proc ADSP-SC835");
      expect(flashTask.command).to.include("-si-revision any");
      expect(flashTask.command).to.include(
        "-emu ${config:cfs.sfx.flash.emulator}",
      );
      expect(flashTask.command).to.include("flash_algorithms/2183x_flash.dxe");
      expect(flashTask.command).to.include(
        `\${cfs:tool.path.xtensa-sharcfx}/cldp -proc ADSP-SC835 ` +
          "-emu ${config:cfs.sfx.flash.emulator} " +
          '-driver "${config:cfs.sdk.path}/Tools/openocd/share/openocd/scripts/board/flash_algorithms/2183x_flash.dxe" ' +
          "-board adsp21835w_ev_som.cfg " +
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
      expect(flashTask.command).to.include("-board adsp21835w_ev_som.cfg");
      expect(eraseTask.command).to.include("cldp");
      expect(eraseTask.command).to.include("-proc ADSP-SC835");
      expect(eraseTask.command).to.include("-cmd erase");
      expect(eraseTask.command).to.not.include("-cmd erase -erase all");
      expect(eraseTask.command).to.include(
        "-emu ${config:cfs.sfx.flash.emulator}",
      );
      expect(eraseTask.command).to.include("-board adsp21835w_ev_som.cfg");
      expect(eraseTask.command).to.include(
        `\${cfs:tool.path.xtensa-sharcfx}/cldp -proc ADSP-SC835 ` +
          "-emu ${config:cfs.sfx.flash.emulator} " +
          '-driver "${config:cfs.sdk.path}/Tools/openocd/share/openocd/scripts/board/flash_algorithms/2183x_flash.dxe" ' +
          "-board adsp21835w_ev_som.cfg " +
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

  describe("GenerateWorkspace_ArtifactType_ShouldGenerateCorrectMakefile", () => {
    it("Should generate SFX Makefile with ARTIFACT_TYPE defaulting to executable", async () => {
      cfsWorkspace = {
        location: "tests/unit-tests/plugins/sharcfx-single-core-tflm/data",
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
        location: "tests/unit-tests/plugins/sharcfx-single-core-tflm/data",
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
        location: "tests/unit-tests/plugins/sharcfx-single-core-tflm/data",
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
        location: "tests/unit-tests/plugins/sharcfx-single-core-tflm/data",
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
        location: "tests/unit-tests/plugins/sharcfx-single-core-tflm/data",
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
      const xtRunConfig = launchJson.configurations.find(
        (candidate: { name: string }) =>
          candidate.name === "Debug with GDB and xt-run (Simulator)",
      );
      expect(
        xtRunConfig.customLaunchSetupCommands.some(
          (command: { text: string }) =>
            command.text ===
            "source ${workspaceFolder}/.vscode/.xt-substitute-path.gdb",
        ),
      ).to.equal(true);
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
        location: "tests/unit-tests/plugins/sharcfx-single-core-tflm/data",
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
        location: "tests/unit-tests/plugins/sharcfx-single-core-tflm/data",
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

    it("Should generate c_cpp_properties.json with TFLM include path", async () => {
      cfsWorkspace = {
        location: "tests/unit-tests/plugins/sharcfx-single-core-tflm/data",
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

      const defaultConfig = propsJson.configurations.find(
        (c: { name: string }) => c.name === "Default",
      );
      expect(defaultConfig).to.exist;
      expect(defaultConfig.compilerPath).to.equal(
        "${env:cfs.project.toolchain.path}/ccfx++",
      );
      expect(defaultConfig.intelliSenseMode).to.equal("clang-x64");

      const hasTflmPath = defaultConfig.includePath.some((p: string) =>
        p.includes("tflite-micro/src"),
      );
      expect(
        hasTflmPath,
        "Should include tflite-micro/src path for TFLM plugin",
      ).to.be.true;

      // Without this define IntelliSense greys out the profiling code that the
      // default project.mk actually builds.
      expect(defaultConfig.defines).to.include("ENABLE_TFLM_PROFILING");
    });
  });

  describe("GenerateWorkspace_Profiling_ShouldWireUpProfilerByDefault", () => {
    const profilingWorkspace = (): CfsWorkspace => ({
      location: "tests/unit-tests/plugins/sharcfx-single-core-tflm/data",
      workspacePluginId: pluginInfo.pluginId,
      workspacePluginVersion: pluginInfo.pluginVersion,
      workspaceName: "profiling-test",
      copyrightDate: new Date().getFullYear().toString(),
      dataModelVersion: "1.0.0",
      package: "bga_ed",
      timestamp: new Date().toISOString(),
      board: "ADSPSC835W-EV-SOM",
      soc: "ADSP-SC835",
      projects: [{ name: "sfx", path: "./sfx" }],
    });

    it("Should enable profiling by default in the generated project.mk", async () => {
      cfsWorkspace = profilingWorkspace();

      await genericPlugin.generateWorkspace(cfsWorkspace);

      const projectMkContent = await fs.readFile(
        joinPath(
          cfsWorkspace.location,
          cfsWorkspace.workspaceName,
          "sfx",
          "project.mk",
        ),
        "utf-8",
      );

      expect(
        resolveMakeVariable([projectMkContent], "ENABLE_TFLM_PROFILING"),
        "profiling must default to enabled",
      ).to.equal("1");
      expect(
        projectMkContent,
        "project.mk must document how to set the core clock used for tick conversion",
      ).to.include("# CXXFLAGS += -D__PROCESSOR_SPEED__=800000000");
    });

    it("Should hook the TFLM profiler into the generated main.cpp", async () => {
      cfsWorkspace = profilingWorkspace();

      await genericPlugin.generateWorkspace(cfsWorkspace);

      const projectPath = joinPath(
        cfsWorkspace.location,
        cfsWorkspace.workspaceName,
        "sfx",
      );
      const mainContent = await fs.readFile(
        joinPath(projectPath, "src/main.cpp"),
        "utf-8",
      );

      expect(mainContent).to.include(
        '#include "tensorflow/lite/micro/micro_profiler.h"',
      );
      expect(
        mainContent,
        "the profiler must be passed to the interpreter, otherwise TFLM records no per-operator events",
      ).to.include("tflite::MicroProfiler profiler;");
      expect(mainContent).to.include("profiler_ptr);");
      expect(mainContent).to.include("profiler.LogCsv();");
      expect(mainContent).to.include("profiler.ClearEvents();");

      // Everything profiling related must compile out when the flag is off.
      const profilerUsageIndex = mainContent.indexOf(
        "tflite::MicroProfiler profiler;",
      );
      const guardIndex = mainContent.lastIndexOf(
        "#ifdef ENABLE_TFLM_PROFILING",
        profilerUsageIndex,
      );
      expect(
        guardIndex,
        "profiler instantiation must sit inside an ENABLE_TFLM_PROFILING guard",
      ).to.be.greaterThan(-1);
      expect(
        mainContent.indexOf("#else", guardIndex),
        "the disabled branch must still provide a null profiler pointer",
      ).to.be.greaterThan(-1);
      expect(mainContent).to.include(
        "tflite::MicroProfilerInterface* profiler_ptr = nullptr;",
      );
    });

    it("Should override the TFLM time source with the Xtensa cycle counter", async () => {
      cfsWorkspace = profilingWorkspace();

      await genericPlugin.generateWorkspace(cfsWorkspace);

      const microTimeContent = await fs.readFile(
        joinPath(
          cfsWorkspace.location,
          cfsWorkspace.workspaceName,
          "sfx",
          "src/adi_micro_time.cpp",
        ),
        "utf-8",
      );

      expect(
        microTimeContent,
        "the shipped micro_time.cc reference implementation reports 0 ticks for every event",
      ).to.include(
        "uint32_t GetCurrentTimeTicks() { return XT_RSR_CCOUNT(); }",
      );
      expect(microTimeContent).to.include(
        "uint32_t ticks_per_second() { return __PROCESSOR_SPEED__; }",
      );
      expect(microTimeContent).to.include("namespace tflite {");
      expect(
        microTimeContent,
        "the override must compile out when profiling is disabled",
      ).to.include("#ifdef ENABLE_TFLM_PROFILING");
    });
  });

  describe("GenerateCode_TflmVariablePrecedence_ShouldRetainProjectDefinedTflmSrcRoot", () => {
    it("Should retain a project-defined TFLM_SRC_ROOT for the FX core when aimodels.mk is included", async () => {
      cfsWorkspace = {
        location: "tests/unit-tests/plugins/sharcfx-single-core-tflm/data",
        workspacePluginId: pluginInfo.pluginId,
        workspacePluginVersion: pluginInfo.pluginVersion,
        workspaceName: "tflm-precedence-test",
        copyrightDate: new Date().getFullYear().toString(),
        dataModelVersion: "1.0.0",
        package: "bga_ed",
        timestamp: new Date().toISOString(),
        board: "ADSPSC835W-EV-SOM",
        soc: "ADSP-SC835",
        projects: [{ name: "sfx", path: "./sfx" }],
      };

      await genericPlugin.generateWorkspace(cfsWorkspace);

      const projectPath = joinPath(
        cfsWorkspace.location,
        cfsWorkspace.workspaceName,
        "sfx",
      );

      // The Makefile must include project.mk before it includes aimodels.mk,
      // otherwise a project-defined TFLM_SRC_ROOT can never survive the
      // default `?=` assignment in aimodels.mk.
      const makefileContent = await fs.readFile(
        joinPath(projectPath, "Makefile"),
        "utf-8",
      );
      const projectMkIncludeIndex = makefileContent.indexOf(
        "include $(PROJECTMK)",
      );
      const aimodelsIncludeIndex = makefileContent.indexOf(
        "sinclude aimodels.mk",
      );
      expect(
        projectMkIncludeIndex,
        "Makefile must include project.mk",
      ).to.be.greaterThan(-1);
      expect(
        aimodelsIncludeIndex,
        "Makefile must include aimodels.mk",
      ).to.be.greaterThan(-1);
      expect(
        projectMkIncludeIndex,
        "project.mk must be included before aimodels.mk so project overrides take precedence",
      ).to.be.lessThan(aimodelsIncludeIndex);

      // This plugin's own cfsconfig already ships an AIModels entry for the
      // FX core, so no manual injection is needed before code gen.
      const cfsConfigFile = joinPath(
        cfsWorkspace.location,
        cfsWorkspace.workspaceName,
        ".cfs",
        `${cfsWorkspace.soc.toLowerCase()}-${cfsWorkspace.package.toLowerCase()}.cfsconfig`,
      );
      const cfsConfig = JSON.parse(
        await fs.readFile(cfsConfigFile, "utf-8"),
      ) as CfsConfig;

      const cfsProject = cfsConfig.Projects.find(
        (p: ConfiguredProject) =>
          p.PluginId === "com.analog.project.sharcfx.plugin" &&
          p.CoreId === "FX",
      );
      if (!cfsProject) {
        expect.fail("SHARC-FX FX project not found in cfsconfig");
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
      ) as CfsSocDataModel;

      const codeGenService = new CodeGenerationService();
      await codeGenService.runCodeGeneration(
        {
          pluginId: cfsProject.PluginId,
          cfsconfig: cfsConfig,
          projectId: cfsProject.ProjectId,
          coreId: cfsProject.CoreId,
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

      // With an unmodified project.mk, nothing sets TFLM_SRC_ROOT before
      // aimodels.mk, so its default (`?=`) value must win.
      expect(
        resolveMakeVariable(
          [projectMkContent, aimodelsMkContent],
          "TFLM_SRC_ROOT",
        ),
      ).to.equal("$(CFSAI_PATH)/lib/sharc-fx/tflite-micro/src");

      // Simulate a project uncommenting/editing the generated example
      // override. This must survive being combined with aimodels.mk's `?=`
      // default, proving project-defined precedence is retained.
      const customTflmSrcRoot = "/custom/tflite-micro";
      const overriddenProjectMkContent = projectMkContent.replace(
        "# TFLM_SRC_ROOT := /path/to/tflite-micro",
        `TFLM_SRC_ROOT := ${customTflmSrcRoot}`,
      );
      expect(overriddenProjectMkContent).to.not.equal(
        projectMkContent,
        "project.mk must contain the expected commented TFLM_SRC_ROOT example line",
      );
      expect(
        resolveMakeVariable(
          [overriddenProjectMkContent, aimodelsMkContent],
          "TFLM_SRC_ROOT",
        ),
      ).to.equal(customTflmSrcRoot);
    });
  });
});
