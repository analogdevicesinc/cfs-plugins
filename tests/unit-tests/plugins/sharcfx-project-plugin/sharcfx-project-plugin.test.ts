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

import { execFileSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { expect } from "chai";
import { GenericPlugin } from "cfs-plugins-sdk";
import type {
  CfsConfig,
  CfsPluginInfo,
  CfsProject,
  CfsSocDataModel,
  CfsWorkspace,
  ConfiguredProject,
} from "cfs-types";
import { CodeGenerationService } from "@services/CodeGenerationService.js";
import SharcFxProjectPlugin from "@plugins/sharcfx-project-plugin/index.js";
import {
  buildTflmAiModels,
  fileExists,
  isDebug,
  resolveMakeVariable,
} from "../../utilities/test-utilities.js";
import { joinPath } from "../../utilities/path-utilities.js";
import {
  validateJsonFile,
  findJsonFiles,
} from "../../utilities/validate-json.js";

describe("Unit tests for the SHARC-FX Project Plugin", () => {
  let projectPlugin: GenericPlugin;
  let workspacePlugin: GenericPlugin;
  let workspacePluginInfo: CfsPluginInfo;
  let projectPluginInfo: CfsPluginInfo;

  const cfsWorkspace = {
    workspacePluginId: "test-plugin-id",
    workspacePluginVersion: "1.0.0",
    workspaceName: "sharcfx-workspace",
    location: "tests/unit-tests/plugins/sharcfx-project-plugin/data",
    copyrightDate: new Date().getFullYear().toString(),
    dataModelVersion: "1.0.0",
    dataModelSchemaVersion: "1.0.0",
    package: "BGA_ED",
    timestamp: new Date().toISOString(),
    board: "ADSPSC835W-EV-SOM",
    soc: "ADSP-SC835",
    projects: [
      {
        id: "sfx-project-id",
        name: "sfx",
        coreId: "FX",
        path: "./sfx",
        pluginId: "com.analog.project.sharcfx.plugin",
        pluginVersion: "1.1.0",
        firmwarePlatform: "SHARC-FX",
        isEnabled: true,
        platformConfig: { ProjectName: "sfx" },
      },
      {
        id: "m33-project-id",
        name: "m33",
        coreId: "M33",
        path: "./m33",
        pluginId: "com.analog.project.sharcfx.plugin",
        pluginVersion: "1.1.0",
        firmwarePlatform: "SHARC-FX",
        isEnabled: true,
        platformConfig: { ProjectName: "m33" },
      },
    ],
  } as CfsWorkspace;

  const sfxProject = {
    id: "sfx-project-id",
    package: "BGA_ED",
    board: "ADSPSC835W-EV-SOM",
    soc: "ADSP-SC835",
    name: "sfx",
    copyrightDate: new Date().getFullYear().toString(),
    path: "tests/unit-tests/plugins/sharcfx-project-plugin/data/sharcfx-workspace",
    pluginId: "com.analog.project.sharcfx.plugin",
    pluginVersion: "1.1.0",
    pluginConfig: {},
    coreId: "FX",
    platformConfig: { ProjectName: "sfx" },
  } as CfsProject;

  const m33Project = {
    id: "m33-project-id",
    package: "BGA_ED",
    board: "ADSPSC835W-EV-SOM",
    soc: "ADSP-SC835",
    name: "m33",
    copyrightDate: new Date().getFullYear().toString(),
    path: "tests/unit-tests/plugins/sharcfx-project-plugin/data/sharcfx-workspace",
    pluginId: "com.analog.project.sharcfx.plugin",
    pluginVersion: "1.1.0",
    pluginConfig: {},
    coreId: "M33",
    platformConfig: { ProjectName: "m33" },
  } as CfsProject;

  before(async () => {
    try {
      const workspacePluginPath =
        "plugins/dist/default-workspace-plugin/.cfsplugin";
      const absoluteWorkspacePath = path.resolve(workspacePluginPath);
      const workspaceFileContent = await fs.readFile(
        absoluteWorkspacePath,
        "utf-8",
      );
      workspacePluginInfo = JSON.parse(workspaceFileContent) as CfsPluginInfo;
      workspacePluginInfo.pluginPath = absoluteWorkspacePath;

      const projectPluginPath =
        "plugins/dist/sharcfx-project-plugin/.cfsplugin";
      const absoluteProjectPath = path.resolve(projectPluginPath);
      const projectFileContent = await fs.readFile(
        absoluteProjectPath,
        "utf-8",
      );
      projectPluginInfo = JSON.parse(projectFileContent) as CfsPluginInfo;
      projectPluginInfo.pluginPath = absoluteProjectPath;
    } catch (error) {
      expect.fail(`${error}`);
    }
  });

  beforeEach(() => {
    workspacePlugin = new GenericPlugin(workspacePluginInfo);
    projectPlugin = new GenericPlugin(projectPluginInfo);
  });

  afterEach(async () => {
    if (!isDebug()) {
      await fs.rm(cfsWorkspace.location, {
        recursive: true,
        force: true,
      });
    }
  });

  it("Should generate an SFX project with valid JSON outputs", async () => {
    const projectPath =
      sfxProject.path +
      "/" +
      (sfxProject.platformConfig as { ProjectName: string }).ProjectName;
    await workspacePlugin.generateWorkspace(cfsWorkspace);
    await projectPlugin.generateProject(projectPath, sfxProject);

    const projExists = await fileExists(projectPath);
    expect(projExists, "SFX project directory should exist").to.be.true;

    const jsonFiles = await findJsonFiles(projectPath);
    expect(jsonFiles.length).to.be.greaterThan(0, "No JSON files found");
    for (const file of jsonFiles) {
      const result = await validateJsonFile(file);
      expect(result, `Error: '${file}' is not a valid JSON file.`).to.be.true;
    }

    const dependenciesPath = `${projectPath}/.cfs/.cfsdependencies`;
    const dependencies = JSON.parse(
      await fs.readFile(dependenciesPath, "utf-8"),
    ) as { packages: { name: string }[] };
    expect(dependencies.packages.map(({ name }) => name)).to.not.include(
      "cortex-m_sharcfx_sdk",
    );
  });

  it("Should generate SFX tasks.json with Windows and Linux environment settings", async () => {
    const projectPath =
      sfxProject.path +
      "/" +
      (sfxProject.platformConfig as { ProjectName: string }).ProjectName;
    await workspacePlugin.generateWorkspace(cfsWorkspace);
    await projectPlugin.generateProject(projectPath, sfxProject);

    const tasksJsonPath = joinPath(projectPath, ".vscode/cfs.tasks.json");
    const tasksContent = await fs.readFile(tasksJsonPath, "utf-8");
    const tasksJson = JSON.parse(tasksContent);

    expect(tasksJson.tasks).to.be.an("array").with.length.greaterThan(0);

    const buildTask = tasksJson.tasks[0];

    // Windows settings
    expect(buildTask.windows).to.exist;
    expect(buildTask.windows.options.env).to.exist;
    expect(buildTask.windows.options.env.PATH).to.include(";");
    expect(buildTask.windows.options.env.SHELL).to.equal("sh.exe");
    expect(buildTask.windows.options.shell.executable).to.include("cmd.exe");

    // Linux settings
    expect(buildTask.linux).to.exist;
    expect(buildTask.linux.options.env).to.exist;
    expect(buildTask.linux.options.env.PATH).to.not.include(";");
    expect(buildTask.linux.options.env.PATH).to.include("xtensa-sharcfx");
    expect(buildTask.linux.options.env.SHELL).to.equal("/bin/sh");
    expect(buildTask.linux.options.shell).to.not.exist;
  });

  it("Should generate SFX launch.json with platform-specific debugger paths", async () => {
    const projectPath =
      sfxProject.path +
      "/" +
      (sfxProject.platformConfig as { ProjectName: string }).ProjectName;
    await workspacePlugin.generateWorkspace(cfsWorkspace);
    await projectPlugin.generateProject(projectPath, sfxProject);

    const launchJsonPath = joinPath(projectPath, ".vscode/launch.json");
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

    // Windows override
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

    // Linux override with correct gdbPath and Python path
    expect(config.linux).to.exist;
    expect(config.linux.gdbPath).to.include("xt-gdb");
    expect(config.linux.gdbPath).to.not.include(".exe");
    expect(config.linux.preLaunchCommands).to.be.an("array");
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
    const linuxPythonCmd = config.linux.preLaunchCommands.find((cmd: string) =>
      cmd.includes("python"),
    );
    expect(linuxPythonCmd).to.include("Tools/python/bin/python");
  });

  it("Should generate SFX c_cpp_properties.json with multi-platform configurations", async () => {
    const projectPath =
      sfxProject.path +
      "/" +
      (sfxProject.platformConfig as { ProjectName: string }).ProjectName;
    await workspacePlugin.generateWorkspace(cfsWorkspace);
    await projectPlugin.generateProject(projectPath, sfxProject);

    const cppPropsPath = joinPath(projectPath, ".vscode/c_cpp_properties.json");
    const propsContent = await fs.readFile(cppPropsPath, "utf-8");
    const propsJson = JSON.parse(propsContent);

    expect(propsJson.configurations).to.be.an("array");

    const configNames = propsJson.configurations.map(
      (c: { name: string }) => c.name,
    );
    expect(configNames).to.include("Default");

    for (const config of propsJson.configurations) {
      expect(config.compilerPath).to.equal(
        "${env:cfs.project.toolchain.path}/ccfx++",
        `${config.name} compilerPath should match toolchain path`,
      );
      expect(config.intelliSenseMode).to.equal(
        "clang-arm64",
        `${config.name} should use clang-arm64 IntelliSense mode`,
      );
    }
  });

  it("Should not crash with undefined board for board-less 2184x SoCs", async () => {
    const noBoardSfxProject = {
      ...sfxProject,
      soc: "ADSP-21844",
      board: undefined,
    } as unknown as CfsProject;

    const noBoardM33Project = {
      ...m33Project,
      soc: "ADSP-21844",
      board: undefined,
    } as unknown as CfsProject;

    const noBoardWorkspace = {
      ...cfsWorkspace,
      soc: "ADSP-21844",
      board: undefined,
    } as unknown as CfsWorkspace;

    await workspacePlugin.generateWorkspace(noBoardWorkspace);

    const sfxPath =
      noBoardSfxProject.path +
      "/" +
      (noBoardSfxProject.platformConfig as { ProjectName: string }).ProjectName;
    try {
      await projectPlugin.generateProject(sfxPath, noBoardSfxProject);
    } catch (e: unknown) {
      const message = (e as Error).message;
      expect(message).to.not.include("Cannot read properties of undefined");
    }

    const m33Path =
      noBoardM33Project.path +
      "/" +
      (noBoardM33Project.platformConfig as { ProjectName: string }).ProjectName;
    await projectPlugin.generateProject(m33Path, noBoardM33Project);

    const tasksJsonPath = joinPath(m33Path, ".vscode/cfs.tasks.json");
    const tasksContent = await fs.readFile(tasksJsonPath, "utf-8");
    const tasksJson = JSON.parse(tasksContent);

    const flashTask = tasksJson.tasks.find(
      (task: { label: string }) => task.label === "flash",
    );
    const eraseTask = tasksJson.tasks.find(
      (task: { label: string }) => task.label === "erase",
    );
    expect(flashTask, "flash task should not exist for board-less M33").to.not
      .exist;
    expect(eraseTask, "erase task should not exist for board-less M33").to.not
      .exist;

    const settingsJsonPath = joinPath(m33Path, ".vscode/settings.json");
    const settingsContent = await fs.readFile(settingsJsonPath, "utf-8");
    const settings = JSON.parse(settingsContent);

    expect(settings).to.not.have.property("cfs.arm.flash.eraseMode");
    expect(settings).to.not.have.property("cfs.arm.flash.emulator");
    expect(settings).to.not.have.property("cfs.arm.flash.offset");
  });

  it("Should generate an M33 project with valid JSON outputs", async () => {
    const projectPath =
      m33Project.path +
      "/" +
      (m33Project.platformConfig as { ProjectName: string }).ProjectName;
    await workspacePlugin.generateWorkspace(cfsWorkspace);
    await projectPlugin.generateProject(projectPath, m33Project);

    const projExists = await fileExists(projectPath);
    expect(projExists, "M33 project directory should exist").to.be.true;

    const jsonFiles = await findJsonFiles(projectPath);
    expect(jsonFiles.length).to.be.greaterThan(0, "No JSON files found");
    for (const file of jsonFiles) {
      const result = await validateJsonFile(file);
      expect(result, `Error: '${file}' is not a valid JSON file.`).to.be.true;
    }

    const dependenciesPath = `${projectPath}/.cfs/.cfsdependencies`;
    const dependencies = JSON.parse(
      await fs.readFile(dependenciesPath, "utf-8"),
    ) as { packages: { name: string }[] };
    expect(dependencies.packages.map(({ name }) => name)).to.include(
      "cortex-m_sharcfx_sdk",
    );
  });

  it("Should generate M33 tasks.json with Windows and Linux environment settings", async () => {
    const projectPath =
      m33Project.path +
      "/" +
      (m33Project.platformConfig as { ProjectName: string }).ProjectName;
    await workspacePlugin.generateWorkspace(cfsWorkspace);
    await projectPlugin.generateProject(projectPath, m33Project);

    const tasksJsonPath = joinPath(projectPath, ".vscode/cfs.tasks.json");
    const tasksContent = await fs.readFile(tasksJsonPath, "utf-8");
    const tasksJson = JSON.parse(tasksContent);

    expect(tasksJson.tasks).to.be.an("array").with.length.greaterThan(0);

    const buildTask = tasksJson.tasks[0];
    const flashTask = tasksJson.tasks.find(
      (task: { label: string }) => task.label === "flash",
    );
    const eraseTask = tasksJson.tasks.find(
      (task: { label: string }) => task.label === "erase",
    );

    expect(flashTask, "flash task should exist in M33 tasks").to.exist;
    expect(eraseTask, "erase task should exist in M33 tasks").to.exist;
    expect(flashTask.command).to.include("elfloader");
    expect(flashTask.command).to.include("cldp");
    expect(flashTask.command).to.include("-bspi -fbinary -bcode 1");
    expect(flashTask.command).to.include("-proc ADSP-SC835");
    expect(flashTask.command).to.include("-core2=");
    expect(flashTask.command).to.include(
      "-emu ${config:cfs.arm.flash.emulator}",
    );
    expect(flashTask.command).to.include("-board adsp21835w_ev_som.cfg");
    expect(flashTask.command).to.include(
      `\${cfs:tool.path.xtensa-sharcfx}/cldp -proc ADSP-SC835 ` +
        "-emu ${config:cfs.arm.flash.emulator} " +
        '-driver "${config:cfs.sdk.path}/Tools/openocd/share/openocd/scripts/board/flash_algorithms/2183x_flash.dxe" ' +
        "-board adsp21835w_ev_som.cfg " +
        '-openocdroot "${config:cfs.sdk.path}/Tools/openocd" ' +
        "-verbose -cmd prog " +
        '-file "${workspaceFolder}/build/${workspaceFolderBasename}_Core2.ldr" ' +
        "-format bin " +
        "-erase ${config:cfs.arm.flash.eraseMode} " +
        "-offset ${config:cfs.arm.flash.offset}",
    );
    expect(eraseTask.command).to.include("cldp");
    expect(eraseTask.command).to.include("-proc ADSP-SC835");
    expect(eraseTask.command).to.include("-cmd erase");
    expect(eraseTask.command).to.not.include("-cmd erase -erase all");
    expect(eraseTask.command).to.include(
      "-emu ${config:cfs.arm.flash.emulator}",
    );
    expect(eraseTask.command).to.include("-board adsp21835w_ev_som.cfg");
    expect(eraseTask.command).to.include(
      `\${cfs:tool.path.xtensa-sharcfx}/cldp -proc ADSP-SC835 ` +
        "-emu ${config:cfs.arm.flash.emulator} " +
        '-driver "${config:cfs.sdk.path}/Tools/openocd/share/openocd/scripts/board/flash_algorithms/2183x_flash.dxe" ' +
        "-board adsp21835w_ev_som.cfg " +
        '-openocdroot "${config:cfs.sdk.path}/Tools/openocd" ' +
        "-verbose -cmd erase",
    );

    const settingsJsonPath = joinPath(projectPath, ".vscode/settings.json");
    const settingsContent = await fs.readFile(settingsJsonPath, "utf-8");
    const settings = JSON.parse(settingsContent);

    expect(settings["cfs.arm.flash.eraseMode"]).to.equal("affected");
    expect(settings["cfs.arm.flash.emulator"]).to.equal("2000");
    expect(settings["cfs.arm.flash.offset"]).to.equal("0x0");

    // Windows settings
    expect(buildTask.windows).to.exist;
    expect(buildTask.windows.options.env).to.exist;
    expect(buildTask.windows.options.env.PATH).to.include(";");
    expect(buildTask.windows.options.env.SHELL).to.equal("sh.exe");
    expect(buildTask.windows.options.shell.executable).to.include("cmd.exe");

    // Linux settings
    expect(buildTask.linux).to.exist;
    expect(buildTask.linux.options.env).to.exist;
    expect(buildTask.linux.options.env.PATH).to.not.include(";");
    expect(buildTask.linux.options.env.PATH).to.include(
      "arm.none.eabi.toolchain",
    );
    expect(buildTask.linux.options.env.SHELL).to.equal("/bin/sh");
    expect(buildTask.linux.options.shell).to.not.exist;
  });

  it("Should generate M33 launch.json with platform-specific GDB paths", async () => {
    const projectPath =
      m33Project.path +
      "/" +
      (m33Project.platformConfig as { ProjectName: string }).ProjectName;
    await workspacePlugin.generateWorkspace(cfsWorkspace);
    await projectPlugin.generateProject(projectPath, m33Project);

    const launchJsonPath = joinPath(projectPath, ".vscode/launch.json");
    const launchContent = await fs.readFile(launchJsonPath, "utf-8");
    const launchJson = JSON.parse(launchContent);

    const config = launchJson.configurations[0];

    // Base gdbPath (Linux default)
    expect(config.gdbPath).to.include("arm-none-eabi-gdb");
    expect(config.gdbPath).to.not.include(".exe");

    // Windows override
    expect(config.windows).to.exist;
    expect(config.windows.gdbPath).to.include("arm-none-eabi-gdb.exe");
  });

  it("Should generate inline PowerShell tailing for a manual M33 project", async () => {
    const projectPath = joinPath(
      m33Project.path,
      (m33Project.platformConfig as { ProjectName: string }).ProjectName,
    );
    await workspacePlugin.generateWorkspace(cfsWorkspace);
    await projectPlugin.generateProject(projectPath, m33Project);

    const tasksJson = JSON.parse(
      await fs.readFile(
        joinPath(projectPath, ".vscode/cfs.tasks.json"),
        "utf-8",
      ),
    ) as { tasks: { label: string; windows?: { command: string } }[] };
    const tailTask = tasksJson.tasks.find(
      (task) => task.label === "QEMU: tail stdout",
    );
    expect(tailTask?.windows?.command).to.include(
      "Get-Content -LiteralPath '.vscode/.qemu.stdout.log' -Tail 200 -Wait",
    );
  });

  it("Should generate QEMU launch, tasks, and server script for a manual M33 project", async () => {
    const projectPath = joinPath(
      m33Project.path,
      (m33Project.platformConfig as { ProjectName: string }).ProjectName,
    );
    await workspacePlugin.generateWorkspace(cfsWorkspace);
    await projectPlugin.generateProject(projectPath, m33Project);

    const launchJson = JSON.parse(
      await fs.readFile(joinPath(projectPath, ".vscode/launch.json"), "utf-8"),
    ) as {
      configurations: {
        name: string;
        type: string;
        servertype?: string;
        gdbTarget?: string;
        preLaunchTask?: string;
        postDebugTask?: string;
      }[];
    };
    const qemuLaunch = launchJson.configurations.find(
      (configuration) =>
        configuration.name === "Debug with GDB and QEMU (Simulator)",
    );
    expect(qemuLaunch).to.include({
      type: "cortex-debug",
      servertype: "external",
      gdbTarget: "localhost:10000",
      preLaunchTask: "CFS: Start QEMU GDB Server",
      postDebugTask: "CFS: Stop QEMU GDB Server",
    });

    const tasksJson = JSON.parse(
      await fs.readFile(
        joinPath(projectPath, ".vscode/cfs.tasks.json"),
        "utf-8",
      ),
    ) as {
      tasks: {
        label: string;
        dependsOn?: string;
        windows?: { command: string };
        linux?: { command: string };
      }[];
    };
    const startTask = tasksJson.tasks.find(
      (task) => task.label === "Start QEMU GDB Server",
    );
    const stopTask = tasksJson.tasks.find(
      (task) => task.label === "Stop QEMU GDB Server",
    );
    expect(startTask?.dependsOn).to.equal("CFS: debug: check");
    expect(startTask?.windows?.command).to.include("qemu-gdbserver.py");
    expect(startTask?.windows?.command).to.include("qemu-system-aarch32.exe");
    expect(startTask?.linux?.command).to.include("qemu-gdbserver.py");
    expect(startTask?.linux?.command).to.include("qemu-system-aarch32");
    expect(stopTask?.windows?.command).to.include('"stop"');
    expect(stopTask?.linux?.command).to.include("'stop'");

    const serverScriptPath = joinPath(projectPath, ".vscode/qemu-gdbserver.py");
    expect(await fileExists(serverScriptPath)).to.equal(true);
    expect(await fs.readFile(serverScriptPath, "utf-8")).to.include('"-gdb",');
  });

  it("Should generate M33 c_cpp_properties.json with correct compiler path", async () => {
    const projectPath =
      m33Project.path +
      "/" +
      (m33Project.platformConfig as { ProjectName: string }).ProjectName;
    await workspacePlugin.generateWorkspace(cfsWorkspace);
    await projectPlugin.generateProject(projectPath, m33Project);

    const cppPropsPath = joinPath(projectPath, ".vscode/c_cpp_properties.json");
    const propsContent = await fs.readFile(cppPropsPath, "utf-8");
    const propsJson = JSON.parse(propsContent);

    expect(propsJson.configurations).to.be.an("array");

    const win32Config = propsJson.configurations.find(
      (c: { name: string }) => c.name === "Win32",
    );
    expect(win32Config).to.exist;
    expect(win32Config.compilerPath).to.include("arm-none-eabi-gcc.exe");
    expect(win32Config.intelliSenseMode).to.equal("gcc-arm");

    const linuxConfig = propsJson.configurations.find(
      (c: { name: string }) => c.name === "Linux",
    );
    expect(linuxConfig).to.exist;
    expect(linuxConfig.compilerPath).to.include("arm-none-eabi-gcc");
    expect(linuxConfig.compilerPath).to.not.include(".exe");
    expect(linuxConfig.intelliSenseMode).to.equal("gcc-arm");
    expect(propsContent).to.include(
      "ADSP-SC83x_DFP/**/Include/**",
      "M33 IntelliSense paths must not pin a DFP version",
    );
  });

  it("Should discover a single installed DFP and validate the M33 pack directories", async () => {
    const projectPath =
      m33Project.path +
      "/" +
      (m33Project.platformConfig as { ProjectName: string }).ProjectName;
    await workspacePlugin.generateWorkspace(cfsWorkspace);
    await projectPlugin.generateProject(projectPath, m33Project);

    const makefileContent = await fs.readFile(
      joinPath(projectPath, "Makefile"),
      "utf-8",
    );
    expect(makefileContent).to.include(
      "ADSP_SC83X_DFP_ROOT ?= $(patsubst %/Source/.,%,$(wildcard $(SDK_PATH)/packs/AnalogDevices/ADSP-SC83x_DFP/*/Source/.))",
    );
    expect(makefileContent.indexOf("include $(PROJECTMK)")).to.be.lessThan(
      makefileContent.indexOf(
        "ifneq ($(if $(MAKECMDGOALS),$(filter-out clean clean-all help,$(MAKECMDGOALS)),all),)",
      ),
      "DFP validation must run after project.mk can override the root",
    );
    expect(makefileContent.replace(/\r\n/g, "\n")).to.include(
      [
        "ifneq ($(if $(MAKECMDGOALS),$(filter-out clean clean-all help,$(MAKECMDGOALS)),all),)",
        "ifneq ($(words $(ADSP_SC83X_DFP_ROOT)),1)",
        "$(error Expected exactly one ADSP-SC83x_DFP pack under $(SDK_PATH)/packs/AnalogDevices; set ADSP_SC83X_DFP_ROOT explicitly)",
        "endif",
        "ifeq ($(and $(wildcard $(ADSP_SC83X_DFP_ROOT)/Source/.),$(wildcard $(ADSP_SC83X_DFP_ROOT)/Include/.)),)",
        "$(error ADSP-SC83x_DFP pack must contain Source and Include directories: $(ADSP_SC83X_DFP_ROOT))",
        "endif",
        "endif",
      ].join("\n"),
    );
    expect(makefileContent).to.include(
      "EXTERNAL_SRC_DIRS = $(ADSP_SC83X_DFP_ROOT)/Source",
    );
    expect(makefileContent).to.include('-I"$(ADSP_SC83X_DFP_ROOT)/Include"');
    expect(makefileContent).to.not.include("lastword $(sort $(wildcard");
    expect(makefileContent).to.not.match(/ADSP-SC83x_DFP\/\d/);
  });

  it("Should generate M33 linker output and artifact paths with .elf extension", async () => {
    const projectPath =
      m33Project.path +
      "/" +
      (m33Project.platformConfig as { ProjectName: string }).ProjectName;
    await workspacePlugin.generateWorkspace(cfsWorkspace);
    await projectPlugin.generateProject(projectPath, m33Project);

    const makefileContent = await fs.readFile(
      joinPath(projectPath, "Makefile"),
      "utf-8",
    );
    expect(makefileContent).to.include(
      "ELF = $(BUILD_DIR)/$(PROJECT).elf",
      "M33 Makefile must define ELF variable with .elf extension",
    );
    expect(makefileContent).to.include(
      "-o $(ELF)",
      "M33 Makefile linker must emit the declared ELF target",
    );

    const settingsContent = await fs.readFile(
      joinPath(projectPath, ".vscode/settings.json"),
      "utf-8",
    );
    const settings = JSON.parse(settingsContent);
    expect(settings["cfs.programFile"]).to.equal(
      "${workspaceFolder}/build/${workspaceFolderBasename}.elf",
      "M33 programFile must use .elf extension",
    );

    const tasksContent = await fs.readFile(
      joinPath(projectPath, ".vscode/cfs.tasks.json"),
      "utf-8",
    );
    const tasksJson = JSON.parse(tasksContent);
    const flashTask = tasksJson.tasks.find(
      (task: { label: string }) => task.label === "flash",
    );
    expect(flashTask, "flash task must exist").to.exist;
    expect(flashTask.command).to.include(
      "${workspaceFolderBasename}.elf",
      "M33 flash task must reference .elf in -core2 argument",
    );
  });

  describe("GenerateProject_ArtifactType_ShouldGenerateCorrectMakefile", () => {
    it("Should generate SFX Makefile with ARTIFACT_TYPE defaulting to executable", async () => {
      const projectPath =
        sfxProject.path +
        "/" +
        (sfxProject.platformConfig as { ProjectName: string }).ProjectName;
      await workspacePlugin.generateWorkspace(cfsWorkspace);
      await projectPlugin.generateProject(projectPath, sfxProject);

      const makefilePath = joinPath(projectPath, "Makefile");
      const makefileContent = await fs.readFile(makefilePath, "utf-8");

      expect(makefileContent).to.include(".DEFAULT_GOAL := all");
      expect(makefileContent).to.include("ARTIFACT_TYPE ?= executable");
      expect(makefileContent).to.include("all: link");
      expect(makefileContent).to.include("V ?= 0");
      expect(makefileContent).to.include("$(Q)$(CXX) -o $(DXE)");
    });

    it("Should generate Xtensa source mappings from the selected debug executable", async () => {
      const projectPath =
        sfxProject.path +
        "/" +
        (sfxProject.platformConfig as { ProjectName: string }).ProjectName;
      await workspacePlugin.generateWorkspace(cfsWorkspace);
      await projectPlugin.generateProject(projectPath, sfxProject);

      const makefileContent = await fs.readFile(
        joinPath(projectPath, "Makefile"),
        "utf-8",
      );
      expect(makefileContent).to.include("DEBUG_EXE ?= $(DXE)");
      expect(makefileContent).to.include(
        'sh .vscode/gen-xt-substitute-path.sh "$(DEBUG_EXE)" "$(SFX_PATH)"',
      );

      const tasksJson = JSON.parse(
        await fs.readFile(
          joinPath(projectPath, ".vscode/cfs.tasks.json"),
          "utf-8",
        ),
      );
      const debugCheckTask = tasksJson.tasks.find(
        (task: { label: string }) => task.label === "debug: check",
      );
      expect(debugCheckTask.command).to.include(
        'DEBUG_EXE="${config:cfs.programFile}"',
      );
    });

    it("Should generate the shared Xtensa source mapping helper", async () => {
      const projectPath =
        sfxProject.path +
        "/" +
        (sfxProject.platformConfig as { ProjectName: string }).ProjectName;
      await workspacePlugin.generateWorkspace(cfsWorkspace);
      await projectPlugin.generateProject(projectPath, sfxProject);

      const helperContent = await fs.readFile(
        joinPath(projectPath, ".vscode/gen-xt-substitute-path.sh"),
        "utf-8",
      );
      expect(helperContent).to.equal(
        await fs.readFile(
          "plugins/common/sharcfx/scripts/gen-xt-substitute-path.sh",
          "utf-8",
        ),
      );
    });

    it("Should execute the Xtensa source mapping recipe and preserve mappings on failure", async () => {
      const projectPath =
        sfxProject.path +
        "/" +
        (sfxProject.platformConfig as { ProjectName: string }).ProjectName;
      await workspacePlugin.generateWorkspace(cfsWorkspace);
      await projectPlugin.generateProject(projectPath, sfxProject);

      const makefileContent = await fs.readFile(
        joinPath(projectPath, "Makefile"),
        "utf-8",
      );
      const recipeStart = makefileContent.indexOf(
        "gen-xt-substitute-path: all",
      );
      const recipeEnd = makefileContent.indexOf("\n# Tools", recipeStart);
      const recipeLines = makefileContent
        .slice(recipeStart, recipeEnd)
        .split(/\r?\n/)
        .filter((line) => line.startsWith("\t"));
      expect(recipeLines).to.have.lengthOf(1);
      const mappingRecipe = [
        'PATH="./bin:$PATH"; export PATH',
        recipeLines[0]
          .trim()
          .replace(/^@/, "")
          .replaceAll("$(DEBUG_EXE)", "fixture-program.dxe")
          .replaceAll("$(SFX_PATH)", "${MAPPING_SFX_PATH}"),
      ].join("\n");

      const fixtureDir = path.join(projectPath, "mapping recipe test");
      const stubBinDir = path.join(fixtureDir, "bin");
      const mappingPath = path.join(
        fixtureDir,
        ".vscode",
        ".xt-substitute-path.gdb",
      );
      const fixturePath = "dwarf-info.txt";
      let shellPath = "/bin/sh";
      if (process.platform === "win32") {
        const gitPaths = execFileSync("where.exe", ["git.exe"], {
          encoding: "utf-8",
        })
          .split(/\r?\n/)
          .map((gitPath) => gitPath.trim())
          .filter(Boolean);
        const candidates = gitPaths.flatMap((gitPath) => {
          const gitDir = path.dirname(gitPath);
          return [
            path.resolve(gitDir, "..", "bin", "bash.exe"),
            path.resolve(gitDir, "..", "..", "bin", "bash.exe"),
          ];
        });
        const available = await Promise.all(
          candidates.map((candidate) =>
            fs
              .stat(candidate)
              .then((stat) => stat.isFile())
              .catch(() => false),
          ),
        );
        const bashPath = candidates.find((_, index) => available[index]);
        if (!bashPath) {
          throw new Error(
            "Git Bash was not found beside the installed Git executables",
          );
        }
        shellPath = bashPath;
      }
      await fs.mkdir(stubBinDir, { recursive: true });
      await fs.mkdir(path.dirname(mappingPath), { recursive: true });
      await fs.copyFile(
        joinPath(projectPath, ".vscode/gen-xt-substitute-path.sh"),
        path.join(fixtureDir, ".vscode", "gen-xt-substitute-path.sh"),
      );
      await fs.writeFile(
        path.join(fixtureDir, "dwarf-info.txt"),
        [
          " <1><0x10>: DW_AT_name : /build/runtime-a/xtensa-elf/src/runtime/a.c",
          " <1><0x20>: DW_AT_comp_dir : /opt/runtime-b/xtensa-elf/src",
          " <1><0x30>: DW_AT_name : /build/runtime-a/xtensa-elf/src/runtime/duplicate.c",
          " <1><0x40>: DW_AT_name : C:/build/runtime-c/xtensa-elf/src/runtime/c.c",
          " <1><0x50>: DW_AT_comp_dir : C:\\build\\runtime-d\\xtensa-elf\\src",
          " <1><0x60>: DW_AT_name : C:\\build\\runtime-d\\xtensa-elf\\src\\runtime\\duplicate.c",
          "",
        ].join("\n"),
      );
      const objdumpStub = path.join(stubBinDir, "xt-objdump");
      await fs.writeFile(
        objdumpStub,
        '#!/bin/sh\ncat "$DWARF_FIXTURE"\nexit "${XT_OBJDUMP_EXIT:-0}"\n',
      );
      await fs.chmod(objdumpStub, 0o755);

      const executeRecipe = (exitCode: string, sfxPath = "/local/toolchain") =>
        execFileSync(shellPath, ["-c", mappingRecipe], {
          cwd: fixtureDir,
          encoding: "utf-8",
          env: {
            ...process.env,
            DWARF_FIXTURE: fixturePath,
            XT_OBJDUMP_EXIT: exitCode,
            MAPPING_SFX_PATH: sfxPath,
          },
        });

      executeRecipe("0");
      expect(await fs.readFile(mappingPath, "utf-8")).to.equal(
        [
          'set substitute-path "/build/runtime-a/xtensa-elf/src" "/local/toolchain/Xtensa/XtensaTools/xtensa-elf/src"',
          'set substitute-path "/opt/runtime-b/xtensa-elf/src" "/local/toolchain/Xtensa/XtensaTools/xtensa-elf/src"',
          'set substitute-path "C:/build/runtime-c/xtensa-elf/src" "/local/toolchain/Xtensa/XtensaTools/xtensa-elf/src"',
          'set substitute-path "C:/build/runtime-d/xtensa-elf/src" "/local/toolchain/Xtensa/XtensaTools/xtensa-elf/src"',
          "",
        ].join("\n"),
      );

      const existingMappings = "existing mappings must remain intact\n";
      await fs.writeFile(mappingPath, existingMappings);
      expect(() => executeRecipe("17")).to.throw();
      expect(await fs.readFile(mappingPath, "utf-8")).to.equal(
        existingMappings,
      );

      await fs.writeFile(
        path.join(fixtureDir, "dwarf-info.txt"),
        " <1><0x10>: DW_AT_name : relative/runtime/source.c\n",
      );
      executeRecipe("0");
      expect(await fs.readFile(mappingPath, "utf-8")).to.equal(
        existingMappings,
      );

      await fs.unlink(mappingPath);
      executeRecipe("0");
      expect(await fs.readFile(mappingPath, "utf-8")).to.equal("");

      for (const lineEnding of ["\n", "\r\n"]) {
        await fs.writeFile(
          path.join(fixtureDir, fixturePath),
          [
            " <1><0x10>: DW_AT_name : relative/runtime/source.c",
            " <1><0x20>: DW_AT_comp_dir : (indirect string, offset: 0x12): C:\\build\\runtime\\xtensa-elf\\src",
            " <1><0x30>: DW_AT_name : /xtensa-elf/src/runtime/a.c",
            " <1><0x40>: DW_AT_comp_dir : C:/xtensa-elf/src",
            ' <1><0x50>: DW_AT_name : /build/Team "A"/xtensa-elf/src/runtime/a.c',
            " <1><0x60>: DW_AT_name : /build/Team (A): runtime/xtensa-elf/src/runtime/a.c",
            "",
          ].join(lineEnding),
        );
        executeRecipe("0", 'C:\\adi\\Team "A"\\xtensa');
        const destination =
          'C:/adi/Team \\"A\\"/xtensa/Xtensa/XtensaTools/xtensa-elf/src';
        expect(await fs.readFile(mappingPath, "utf-8")).to.equal(
          [
            `set substitute-path "/build/Team \\"A\\"/xtensa-elf/src" "${destination}"`,
            `set substitute-path "/build/Team (A): runtime/xtensa-elf/src" "${destination}"`,
            `set substitute-path "/xtensa-elf/src" "${destination}"`,
            `set substitute-path "C:/build/runtime/xtensa-elf/src" "${destination}"`,
            `set substitute-path "C:/xtensa-elf/src" "${destination}"`,
            "",
          ].join("\n"),
        );
      }
    });

    it("Should generate SFX Makefile with static library targets", async () => {
      const projectPath =
        sfxProject.path +
        "/" +
        (sfxProject.platformConfig as { ProjectName: string }).ProjectName;
      await workspacePlugin.generateWorkspace(cfsWorkspace);
      await projectPlugin.generateProject(projectPath, sfxProject);

      const makefilePath = joinPath(projectPath, "Makefile");
      const makefileContent = await fs.readFile(makefilePath, "utf-8");

      expect(makefileContent).to.include("AR = xt-ar");
      expect(makefileContent).to.include("$(AR) $(ARFLAGS) $(LIB) $(ALL_OBJS)");
      expect(makefileContent).to.include("lib$(PROJECT).a");
    });

    it("Should generate M33 Makefile with ARTIFACT_TYPE defaulting to executable", async () => {
      const projectPath =
        m33Project.path +
        "/" +
        (m33Project.platformConfig as { ProjectName: string }).ProjectName;
      await workspacePlugin.generateWorkspace(cfsWorkspace);
      await projectPlugin.generateProject(projectPath, m33Project);

      const makefilePath = joinPath(projectPath, "Makefile");
      const makefileContent = await fs.readFile(makefilePath, "utf-8");

      expect(makefileContent).to.include("ARTIFACT_TYPE ?= executable");
      expect(makefileContent).to.include("all: link");
    });

    it("Should generate M33 Makefile with binary and hex targets", async () => {
      const projectPath =
        m33Project.path +
        "/" +
        (m33Project.platformConfig as { ProjectName: string }).ProjectName;
      await workspacePlugin.generateWorkspace(cfsWorkspace);
      await projectPlugin.generateProject(projectPath, m33Project);

      const makefilePath = joinPath(projectPath, "Makefile");
      const makefileContent = await fs.readFile(makefilePath, "utf-8");

      expect(makefileContent).to.include("OBJCOPY = arm-none-eabi-objcopy");
      expect(makefileContent).to.include("$(OBJCOPY) -O binary");
      expect(makefileContent).to.include("$(OBJCOPY) -O ihex");
    });
  });

  describe("GenerateProject_ArtifactType_ShouldGenerateCorrectSettings", () => {
    it("Should include cfs.sfx.artifactType in SFX settings", async () => {
      const projectPath =
        sfxProject.path +
        "/" +
        (sfxProject.platformConfig as { ProjectName: string }).ProjectName;
      await workspacePlugin.generateWorkspace(cfsWorkspace);
      await projectPlugin.generateProject(projectPath, sfxProject);

      const settingsPath = joinPath(projectPath, ".vscode/settings.json");
      const settings = JSON.parse(await fs.readFile(settingsPath, "utf-8"));

      expect(settings["cfs.sfx.artifactType"]).to.equal("executable");
      expect(settings["cfs.programFile"]).to.include(".dxe");
    });

    it("Should include cfs.arm.artifactType in M33 settings", async () => {
      const projectPath =
        m33Project.path +
        "/" +
        (m33Project.platformConfig as { ProjectName: string }).ProjectName;
      await workspacePlugin.generateWorkspace(cfsWorkspace);
      await projectPlugin.generateProject(projectPath, m33Project);

      const settingsPath = joinPath(projectPath, ".vscode/settings.json");
      const settings = JSON.parse(await fs.readFile(settingsPath, "utf-8"));

      expect(settings["cfs.arm.artifactType"]).to.equal("executable");
    });
  });

  describe("GenerateProject_ArtifactType_ShouldPassToMakeCommands", () => {
    it("Should pass ARTIFACT_TYPE to SFX build task", async () => {
      const projectPath =
        sfxProject.path +
        "/" +
        (sfxProject.platformConfig as { ProjectName: string }).ProjectName;
      await workspacePlugin.generateWorkspace(cfsWorkspace);
      await projectPlugin.generateProject(projectPath, sfxProject);

      const tasksJsonPath = joinPath(projectPath, ".vscode/cfs.tasks.json");
      const tasksJson = JSON.parse(await fs.readFile(tasksJsonPath, "utf-8"));

      const buildTask = tasksJson.tasks.find(
        (task: { label: string }) => task.label === "build",
      );
      expect(buildTask.command).to.include(
        "ARTIFACT_TYPE=${config:cfs.sfx.artifactType}",
      );
    });

    it("Should pass ARTIFACT_TYPE to M33 build task", async () => {
      const projectPath =
        m33Project.path +
        "/" +
        (m33Project.platformConfig as { ProjectName: string }).ProjectName;
      await workspacePlugin.generateWorkspace(cfsWorkspace);
      await projectPlugin.generateProject(projectPath, m33Project);

      const tasksJsonPath = joinPath(projectPath, ".vscode/cfs.tasks.json");
      const tasksJson = JSON.parse(await fs.readFile(tasksJsonPath, "utf-8"));

      const buildTask = tasksJson.tasks.find(
        (task: { label: string }) => task.label === "build",
      );
      expect(buildTask.command).to.include(
        "ARTIFACT_TYPE=${config:cfs.arm.artifactType}",
      );
    });
  });

  describe("GenerateCode_SRU_ShouldGenerateCorrectSocInit", () => {
    interface SruConfig {
      Connections: Record<string, string>;
      UserDescriptions: Record<string, string>;
      SignalAliases?: Record<string, string>;
      SignalInversions?: Record<string, boolean>;
    }

    type CfsConfigWithSru = CfsConfig & { Sru: SruConfig };

    const SHARCFX_PLUGIN_ID = "com.analog.project.sharcfx.plugin";

    const readCfsConfig = async (
      workspace: CfsWorkspace,
    ): Promise<CfsConfigWithSru> => {
      const cfsConfigPath = joinPath(
        workspace.location,
        workspace.workspaceName,
        ".cfs",
        `${workspace.workspaceName}.cfsconfig`,
      );
      const cfsConfigContent = await fs.readFile(cfsConfigPath, "utf-8");
      return JSON.parse(cfsConfigContent) as CfsConfigWithSru;
    };

    const findSharcFxProject = (cfsConfig: CfsConfig): ConfiguredProject => {
      const project = cfsConfig.Projects.find(
        (candidate) =>
          candidate.PluginId === SHARCFX_PLUGIN_ID && candidate.CoreId === "FX",
      );

      if (project === undefined) {
        expect.fail("SHARC-FX FX project not found in cfsconfig");
      }

      return project;
    };

    const loadSocDataModel = async (
      workspace: CfsWorkspace,
    ): Promise<CfsSocDataModel> =>
      JSON.parse(
        await fs.readFile(
          joinPath(
            "data-models",
            "socs",
            `${workspace.soc.toLowerCase()}-${workspace.package.toLowerCase()}.json`,
          ),
          "utf-8",
        ),
      ) as CfsSocDataModel;

    // Returns the "SRU connections for <peripheral>" header a signal is emitted under.
    const groupHeaderFor = (socInitContent: string, signal: string): string => {
      const headerPrefix = "/* SRU connections for ";
      let header = "";

      for (const line of socInitContent.split(/\r?\n/)) {
        const trimmed = line.trim();

        if (trimmed.startsWith(headerPrefix)) {
          header = trimmed.slice(headerPrefix.length, trimmed.indexOf(" */"));
        } else if (line.includes(signal)) {
          return header;
        }
      }

      return "";
    };

    let workspaceForCodeGen: CfsWorkspace;
    let codeGenService: CodeGenerationService;

    before(() => {
      codeGenService = new CodeGenerationService();
    });

    it("Should generate adi_SRU_Init() with correct SRU macro calls when connections defined", async () => {
      workspaceForCodeGen = {
        workspacePluginId: "test-plugin-id",
        workspacePluginVersion: "1.0.0",
        workspaceName: "sru-connections-test",
        location: "tests/unit-tests/plugins/sharcfx-project-plugin/data",
        copyrightDate: new Date().getFullYear().toString(),
        dataModelVersion: "1.0.0",
        dataModelSchemaVersion: "1.0.0",
        package: "BGA_ED",
        timestamp: new Date().toISOString(),
        board: "ADSPSC835W-EV-SOM",
        soc: "ADSP-SC835",
        projects: [
          {
            id: "sfx-project-id",
            name: "sfx",
            coreId: "FX",
            path: "./sfx",
            pluginId: "com.analog.project.sharcfx.plugin",
            pluginVersion: "1.1.0",
            firmwarePlatform: "SHARC-FX",
            isEnabled: true,
            platformConfig: { ProjectName: "sfx" },
          },
        ],
      };

      // Generate workspace
      await workspacePlugin.generateWorkspace(workspaceForCodeGen);

      // Read generated cfsconfig
      const cfsConfig = await readCfsConfig(workspaceForCodeGen);

      // Add SRU configuration to cfsconfig
      cfsConfig.Sru = {
        Connections: {
          SRC0_CLK_IP_I: "SPT1_A_CLK_O",
          SPT4_A_CLK_I: "DAI1_PB01_O",
          SPT4_B_CLK_I: "DAI1_PB01_O",
          DAI0_PBEN01_I: "HIGH",
        },
        UserDescriptions: {
          SPT4_A_CLK_I: "ADC clock to SPORT 4A",
          SPT4_B_CLK_I: "ADC clock to SPORT 4B",
        },
      };

      // Load SoC data model
      const socDataModel = await loadSocDataModel(workspaceForCodeGen);

      // Get the SHARC-FX project from cfsconfig
      const sfxCfsProject = findSharcFxProject(cfsConfig);

      // Run code generation
      const projectDetails = {
        pluginId: sfxCfsProject.PluginId,
        cfsconfig: cfsConfig,
        projectId: sfxCfsProject.ProjectId,
        coreId: sfxCfsProject.CoreId,
      };

      const generatedFiles = await codeGenService.runCodeGeneration(
        projectDetails,
        socDataModel,
        joinPath(
          workspaceForCodeGen.location,
          workspaceForCodeGen.workspaceName,
        ),
      );

      // Verify soc_init.c was generated
      const socInitPath = joinPath(
        workspaceForCodeGen.location,
        workspaceForCodeGen.workspaceName,
        "sfx",
        "src/system/soc_init.c",
      );
      expect(generatedFiles.some((f) => f.includes("soc_init.c"))).to.equal(
        true,
      );
      expect(await fileExists(socInitPath)).to.equal(true);

      // Read and validate content
      const socInitContent = await fs.readFile(socInitPath, "utf-8");

      // Verify SRU header is included
      expect(socInitContent).to.include("#include <sru.h>");

      // Verify adi_SRU_Init function exists
      expect(socInitContent).to.include("int32_t adi_SRU_Init(void)");
      expect(socInitContent).to.include("Initialize the Signal Routing Unit");

      // Verify SRU macro calls are generated correctly
      expect(socInitContent).to.include("SRU(SPT1_A_CLK_O, SRC0_CLK_IP_I);");
      expect(socInitContent).to.include(
        "SRU(DAI1_PB01_O, SPT4_A_CLK_I); /* ADC clock to SPORT 4A */",
      );
      expect(socInitContent).to.include(
        "SRU(DAI1_PB01_O, SPT4_B_CLK_I); /* ADC clock to SPORT 4B */",
      );
      expect(socInitContent).to.include("SRU(HIGH, DAI0_PBEN01_I);");

      // Verify connections are grouped per peripheral. The header text comes from the
      // data model, so assert the grouping itself rather than specific peripheral names.
      const asrcGroup = groupHeaderFor(socInitContent, "SRC0_CLK_IP_I");
      const sportAGroup = groupHeaderFor(socInitContent, "SPT4_A_CLK_I");
      const sportBGroup = groupHeaderFor(socInitContent, "SPT4_B_CLK_I");
      const daiGroup = groupHeaderFor(socInitContent, "DAI0_PBEN01_I");

      expect([asrcGroup, sportAGroup, daiGroup]).to.not.include("");
      expect(sportAGroup, "SPORT connections should share one group").to.equal(
        sportBGroup,
      );
      expect(new Set([asrcGroup, sportAGroup, daiGroup]).size).to.equal(3);

      // Verify function returns 0
      expect(socInitContent).to.match(/return 0;/);

      // Cleanup
      if (isDebug()) {
        console.log(
          `[DEBUG] Test output preserved at: ${joinPath(
            workspaceForCodeGen.location,
            workspaceForCodeGen.workspaceName,
          )}`,
        );
      }
    });

    it("Should generate default SRU comment when no connections are defined", async () => {
      workspaceForCodeGen = {
        workspacePluginId: "test-plugin-id",
        workspacePluginVersion: "1.0.0",
        workspaceName: "sru-empty-test",
        location: "tests/unit-tests/plugins/sharcfx-project-plugin/data",
        copyrightDate: new Date().getFullYear().toString(),
        dataModelVersion: "1.0.0",
        dataModelSchemaVersion: "1.0.0",
        package: "BGA_ED",
        timestamp: new Date().toISOString(),
        board: "ADSPSC835W-EV-SOM",
        soc: "ADSP-SC835",
        projects: [
          {
            id: "sfx-project-id",
            name: "sfx",
            coreId: "FX",
            path: "./sfx",
            pluginId: "com.analog.project.sharcfx.plugin",
            pluginVersion: "1.1.0",
            firmwarePlatform: "SHARC-FX",
            isEnabled: true,
            platformConfig: { ProjectName: "sfx" },
          },
        ],
      };

      // Generate workspace
      await workspacePlugin.generateWorkspace(workspaceForCodeGen);

      // Read generated cfsconfig
      const cfsConfig = await readCfsConfig(workspaceForCodeGen);

      // Add empty SRU configuration
      cfsConfig.Sru = { Connections: {}, UserDescriptions: {} };

      // Load SoC data model
      const socDataModel = await loadSocDataModel(workspaceForCodeGen);

      // Get the SHARC-FX project
      const sfxCfsProject = findSharcFxProject(cfsConfig);

      // Run code generation
      const projectDetails = {
        pluginId: sfxCfsProject.PluginId,
        cfsconfig: cfsConfig,
        projectId: sfxCfsProject.ProjectId,
        coreId: sfxCfsProject.CoreId,
      };

      await codeGenService.runCodeGeneration(
        projectDetails,
        socDataModel,
        joinPath(
          workspaceForCodeGen.location,
          workspaceForCodeGen.workspaceName,
        ),
      );

      // Read and validate content
      const socInitPath = joinPath(
        workspaceForCodeGen.location,
        workspaceForCodeGen.workspaceName,
        "sfx",
        "src/system/soc_init.c",
      );
      const socInitContent = await fs.readFile(socInitPath, "utf-8");

      // Verify default comment is present
      expect(socInitContent).to.include(
        "/* SRU configuration in default state. */",
      );

      // Verify no SRU() macro calls
      const sruMacroPattern = /SRU\([^)]+,\s*[^)]+\);/g;
      const matches = socInitContent.match(sruMacroPattern);
      expect(matches).to.equal(null);
    });

    it("Should generate SRU macro calls without user description comments when descriptions not provided", async () => {
      workspaceForCodeGen = {
        workspacePluginId: "test-plugin-id",
        workspacePluginVersion: "1.0.0",
        workspaceName: "sru-no-descriptions-test",
        location: "tests/unit-tests/plugins/sharcfx-project-plugin/data",
        copyrightDate: new Date().getFullYear().toString(),
        dataModelVersion: "1.0.0",
        dataModelSchemaVersion: "1.0.0",
        package: "BGA_ED",
        timestamp: new Date().toISOString(),
        board: "ADSPSC835W-EV-SOM",
        soc: "ADSP-SC835",
        projects: [
          {
            id: "sfx-project-id",
            name: "sfx",
            coreId: "FX",
            path: "./sfx",
            pluginId: "com.analog.project.sharcfx.plugin",
            pluginVersion: "1.1.0",
            firmwarePlatform: "SHARC-FX",
            isEnabled: true,
            platformConfig: { ProjectName: "sfx" },
          },
        ],
      };

      // Generate workspace
      await workspacePlugin.generateWorkspace(workspaceForCodeGen);

      // Read generated cfsconfig
      const cfsConfig = await readCfsConfig(workspaceForCodeGen);

      // Add SRU configuration with connections but no descriptions
      cfsConfig.Sru = {
        Connections: {
          SRC0_CLK_IP_I: "SPT1_A_CLK_O",
          SPT4_A_CLK_I: "DAI1_PB01_O",
        },
        UserDescriptions: {},
      };

      // Load SoC data model
      const socDataModel = await loadSocDataModel(workspaceForCodeGen);

      // Get the SHARC-FX project
      const sfxCfsProject = findSharcFxProject(cfsConfig);

      // Run code generation
      const projectDetails = {
        pluginId: sfxCfsProject.PluginId,
        cfsconfig: cfsConfig,
        projectId: sfxCfsProject.ProjectId,
        coreId: sfxCfsProject.CoreId,
      };

      await codeGenService.runCodeGeneration(
        projectDetails,
        socDataModel,
        joinPath(
          workspaceForCodeGen.location,
          workspaceForCodeGen.workspaceName,
        ),
      );

      // Read and validate content
      const socInitPath = joinPath(
        workspaceForCodeGen.location,
        workspaceForCodeGen.workspaceName,
        "sfx",
        "src/system/soc_init.c",
      );
      const socInitContent = await fs.readFile(socInitPath, "utf-8");

      // Verify SRU macro calls exist without inline comments
      expect(socInitContent).to.match(
        /SRU\(SPT1_A_CLK_O, SRC0_CLK_IP_I\);\s*$/m,
      );
      expect(socInitContent).to.match(/SRU\(DAI1_PB01_O, SPT4_A_CLK_I\);\s*$/m);

      // Verify no lines have both SRU call and comment
      const sruWithCommentPattern = /SRU\([^)]+\);[^\S\n]*\/\*/;
      expect(socInitContent).to.not.match(sruWithCommentPattern);
    });

    it("Should annotate signals with their configured aliases", async () => {
      workspaceForCodeGen = {
        workspacePluginId: "test-plugin-id",
        workspacePluginVersion: "1.0.0",
        workspaceName: "sru-signal-aliases-test",
        location: "tests/unit-tests/plugins/sharcfx-project-plugin/data",
        copyrightDate: new Date().getFullYear().toString(),
        dataModelVersion: "1.0.0",
        dataModelSchemaVersion: "1.0.0",
        package: "BGA_ED",
        timestamp: new Date().toISOString(),
        board: "ADSPSC835W-EV-SOM",
        soc: "ADSP-SC835",
        projects: [
          {
            id: "sfx-project-id",
            name: "sfx",
            coreId: "FX",
            path: "./sfx",
            pluginId: "com.analog.project.sharcfx.plugin",
            pluginVersion: "1.1.0",
            firmwarePlatform: "SHARC-FX",
            isEnabled: true,
            platformConfig: { ProjectName: "sfx" },
          },
        ],
      };

      // Generate workspace
      await workspacePlugin.generateWorkspace(workspaceForCodeGen);

      // Read generated cfsconfig
      const cfsConfig = await readCfsConfig(workspaceForCodeGen);

      // Add SRU configuration where only one of the two connected signals has an alias
      cfsConfig.Sru = {
        Connections: {
          SRC0_CLK_IP_I: "SPT1_A_CLK_O",
          SPT4_A_CLK_I: "DAI1_PB01_O",
        },
        UserDescriptions: {
          SPT4_A_CLK_I: "ADC clock to SPORT 4A",
        },
        SignalAliases: {
          SRC0_CLK_IP_I: "ASRC Input Clock",
        },
      };

      // Load SoC data model
      const socDataModel = await loadSocDataModel(workspaceForCodeGen);

      // Get the SHARC-FX project
      const sfxCfsProject = findSharcFxProject(cfsConfig);

      // Run code generation
      const projectDetails = {
        pluginId: sfxCfsProject.PluginId,
        cfsconfig: cfsConfig,
        projectId: sfxCfsProject.ProjectId,
        coreId: sfxCfsProject.CoreId,
      };

      await codeGenService.runCodeGeneration(
        projectDetails,
        socDataModel,
        joinPath(
          workspaceForCodeGen.location,
          workspaceForCodeGen.workspaceName,
        ),
      );

      // Read and validate content
      const socInitPath = joinPath(
        workspaceForCodeGen.location,
        workspaceForCodeGen.workspaceName,
        "sfx",
        "src/system/soc_init.c",
      );
      const socInitContent = await fs.readFile(socInitPath, "utf-8");

      // Aliased signal gets an inline comment right after it
      expect(socInitContent).to.include(
        "SRU(SPT1_A_CLK_O, SRC0_CLK_IP_I /* ASRC Input Clock */);",
      );

      // Signal without an alias is unaffected, and still combines with a user description
      expect(socInitContent).to.include(
        "SRU(DAI1_PB01_O, SPT4_A_CLK_I); /* ADC clock to SPORT 4A */",
      );

      // No alias comment leaks onto a signal that isn't aliased
      expect(socInitContent).to.not.include("SPT1_A_CLK_O /*");
    });

    it("Should not emit SRU code into the M33 core's soc_init.c", async () => {
      workspaceForCodeGen = {
        workspacePluginId: "test-plugin-id",
        workspacePluginVersion: "1.0.0",
        workspaceName: "sru-m33-not-generated-test",
        location: "tests/unit-tests/plugins/sharcfx-project-plugin/data",
        copyrightDate: new Date().getFullYear().toString(),
        dataModelVersion: "1.0.0",
        dataModelSchemaVersion: "1.0.0",
        package: "BGA_ED",
        timestamp: new Date().toISOString(),
        board: "ADSPSC835W-EV-SOM",
        soc: "ADSP-SC835",
        projects: [
          {
            id: "sfx-project-id",
            name: "sfx",
            coreId: "FX",
            path: "./sfx",
            pluginId: "com.analog.project.sharcfx.plugin",
            pluginVersion: "1.1.0",
            firmwarePlatform: "SHARC-FX",
            isEnabled: true,
            platformConfig: { ProjectName: "sfx" },
          },
          {
            id: "m33-project-id",
            name: "m33",
            coreId: "M33",
            path: "./m33",
            pluginId: "com.analog.project.sharcfx.plugin",
            pluginVersion: "1.1.0",
            firmwarePlatform: "SHARC-FX",
            isEnabled: true,
            platformConfig: { ProjectName: "m33" },
          },
        ],
      };

      // Generate workspace
      await workspacePlugin.generateWorkspace(workspaceForCodeGen);

      // Read generated cfsconfig
      const cfsConfig = await readCfsConfig(workspaceForCodeGen);

      // Add SRU configuration; this must not leak into the M33 core's output
      cfsConfig.Sru = {
        Connections: { SRC0_CLK_IP_I: "SPT1_A_CLK_O" },
        UserDescriptions: {},
      };

      // Load SoC data model
      const socDataModel = await loadSocDataModel(workspaceForCodeGen);

      // Get the M33 project
      const m33CfsProject = cfsConfig.Projects.find(
        (candidate) =>
          candidate.PluginId === SHARCFX_PLUGIN_ID &&
          candidate.CoreId === "M33",
      );

      if (m33CfsProject === undefined) {
        expect.fail("SHARC-FX M33 project not found in cfsconfig");
      }

      // Run code generation for the M33 core
      const projectDetails = {
        pluginId: m33CfsProject.PluginId,
        cfsconfig: cfsConfig,
        projectId: m33CfsProject.ProjectId,
        coreId: m33CfsProject.CoreId,
      };

      await codeGenService.runCodeGeneration(
        projectDetails,
        socDataModel,
        joinPath(
          workspaceForCodeGen.location,
          workspaceForCodeGen.workspaceName,
        ),
      );

      // Read and validate content
      const socInitPath = joinPath(
        workspaceForCodeGen.location,
        workspaceForCodeGen.workspaceName,
        "m33",
        "src/system/soc_init.c",
      );
      const socInitContent = await fs.readFile(socInitPath, "utf-8");

      // M33 output must not reference the SHARC-FX-only SRU API
      expect(socInitContent).to.not.include("#include <sru.h>");
      expect(socInitContent).to.not.include("adi_SRU_Init");
      expect(socInitContent).to.not.include("SRU(");

      // Pin-mux generation must still be present for M33
      expect(socInitContent).to.include("int32_t adi_initpinmux(void)");
    });

    it("Should set signal polarity using the SRU header's inverted-destination macros", async () => {
      workspaceForCodeGen = {
        workspacePluginId: "test-plugin-id",
        workspacePluginVersion: "1.0.0",
        workspaceName: "sru-signal-inversions-test",
        location: "tests/unit-tests/plugins/sharcfx-project-plugin/data",
        copyrightDate: new Date().getFullYear().toString(),
        dataModelVersion: "1.0.0",
        dataModelSchemaVersion: "1.0.0",
        package: "BGA_ED",
        timestamp: new Date().toISOString(),
        board: "ADSPSC835W-EV-SOM",
        soc: "ADSP-SC835",
        projects: [
          {
            id: "sfx-project-id",
            name: "sfx",
            coreId: "FX",
            path: "./sfx",
            pluginId: SHARCFX_PLUGIN_ID,
            pluginVersion: "1.1.0",
            firmwarePlatform: "SHARC-FX",
            isEnabled: true,
            platformConfig: { ProjectName: "sfx" },
          },
        ],
      };

      await workspacePlugin.generateWorkspace(workspaceForCodeGen);

      const cfsConfig = await readCfsConfig(workspaceForCodeGen);
      cfsConfig.Sru = {
        Connections: { DAI0_PB19_I: "SPT1_A_CLK_O" },
        UserDescriptions: {},
        SignalInversions: {
          DAI0_PB19_I: true,
          DAI0_PB20_I: false,
          DAI0_MISCA4_I: true,
          DAI0_MISCA5_I: false,
          DAI1_PB19_I: true,
          DAI1_PB20_I: false,
          DAI1_MISCA4_I: true,
          DAI1_MISCA5_I: false,
          SRC0_CLK_IP_I: true,
        },
      };

      const socDataModel = await loadSocDataModel(workspaceForCodeGen);
      const sfxCfsProject = findSharcFxProject(cfsConfig);

      await codeGenService.runCodeGeneration(
        {
          pluginId: sfxCfsProject.PluginId,
          cfsconfig: cfsConfig,
          projectId: sfxCfsProject.ProjectId,
          coreId: sfxCfsProject.CoreId,
        },
        socDataModel,
        joinPath(
          workspaceForCodeGen.location,
          workspaceForCodeGen.workspaceName,
        ),
      );

      const socInitPath = joinPath(
        workspaceForCodeGen.location,
        workspaceForCodeGen.workspaceName,
        "sfx",
        "src/system/soc_init.c",
      );
      const socInitContent = await fs.readFile(socInitPath, "utf-8");

      expect(socInitContent).to.include("SRU(SPT1_A_CLK_O, DAI0_PB19_I);");
      expect(
        socInitContent.match(/SRU\(HIGH, DAI0_INV_PB19_I\);/g),
      ).to.have.length(1);
      expect(socInitContent).to.include("SRU(LOW, DAI0_INV_PB20_I);");
      expect(socInitContent).to.include("SRU(HIGH, DAI0_INV_MISCA4_I);");
      expect(socInitContent).to.include("SRU(LOW, DAI0_INV_MISCA5_I);");
      expect(socInitContent).to.include("SRU(HIGH, DAI1_INV_PB19_I);");
      expect(socInitContent).to.include("SRU(LOW, DAI1_INV_PB20_I);");
      expect(socInitContent).to.include("SRU(HIGH, DAI1_INV_MISCA4_I);");
      expect(socInitContent).to.include("SRU(LOW, DAI1_INV_MISCA5_I);");
      expect(socInitContent).to.not.include("SRU(HIGH, SRC0_CLK_IP_I);");
      expect(socInitContent).to.not.include("SRC0_INV_CLK_IP_I");
      expect(socInitContent).to.not.include("INV_SRC0");
    });
  });

  describe("GenerateCode_TflmVariablePrecedence_ShouldRetainProjectDefinedPath", () => {
    const tflmPathConfigByCore = {
      FX: {
        variableName: "TFLM_SRC_ROOT",
        defaultValue: "$(CFSAI_PATH)/lib/sharc-fx/tflite-micro/src",
      },
      M33: {
        variableName: "TFLITE_PATH",
        defaultValue: "$(CFSAI_PATH)/lib/cortex-m/tflite-micro",
      },
    } as const;

    let codeGenService: CodeGenerationService;

    before(() => {
      codeGenService = new CodeGenerationService();
    });

    for (const [projectDir, coreId] of [
      ["sfx", "FX"],
      ["m33", "M33"],
    ] as const) {
      const { variableName, defaultValue } = tflmPathConfigByCore[coreId];

      it(`Should retain a project-defined ${variableName} for the ${coreId} core when aimodels.mk is included`, async () => {
        const workspaceForCodeGen: CfsWorkspace = {
          workspacePluginId: "test-plugin-id",
          workspacePluginVersion: "1.0.0",
          workspaceName: `tflm-precedence-${coreId.toLowerCase()}-test`,
          location: "tests/unit-tests/plugins/sharcfx-project-plugin/data",
          copyrightDate: new Date().getFullYear().toString(),
          dataModelVersion: "1.0.0",
          dataModelSchemaVersion: "1.0.0",
          package: "BGA_ED",
          timestamp: new Date().toISOString(),
          board: "ADSPSC835W-EV-SOM",
          soc: "ADSP-SC835",
          projects: [
            {
              id: `${projectDir}-project-id`,
              name: projectDir,
              coreId,
              path: `./${projectDir}`,
              pluginId: "com.analog.project.sharcfx.plugin",
              pluginVersion: "1.1.0",
              firmwarePlatform: "SHARC-FX",
              isEnabled: true,
              platformConfig: { ProjectName: projectDir },
            },
          ],
        } as CfsWorkspace;

        await workspacePlugin.generateWorkspace(workspaceForCodeGen);

        const workspacePath = joinPath(
          workspaceForCodeGen.location,
          workspaceForCodeGen.workspaceName,
        );
        const projectPath = joinPath(workspacePath, projectDir);

        const coreProject = {
          id: `${projectDir}-project-id`,
          package: "BGA_ED",
          board: "ADSPSC835W-EV-SOM",
          soc: "ADSP-SC835",
          name: projectDir,
          copyrightDate: new Date().getFullYear().toString(),
          path: workspacePath,
          pluginId: "com.analog.project.sharcfx.plugin",
          pluginVersion: "1.1.0",
          pluginConfig: {},
          coreId,
          platformConfig: { ProjectName: projectDir },
        } as CfsProject;

        await projectPlugin.generateProject(projectPath, coreProject);

        // The Makefile must include project.mk before it includes
        // aimodels.mk, otherwise a project-defined path can never survive
        // the default `?=` assignment in aimodels.mk.
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

        const cfsConfigPath = joinPath(
          workspaceForCodeGen.location,
          workspaceForCodeGen.workspaceName,
          ".cfs",
          `${workspaceForCodeGen.workspaceName}.cfsconfig`,
        );
        const cfsConfig = JSON.parse(
          await fs.readFile(cfsConfigPath, "utf-8"),
        ) as CfsConfig;

        const [cfsProject] = cfsConfig.Projects.filter(
          (candidate) =>
            candidate.PluginId === "com.analog.project.sharcfx.plugin" &&
            candidate.CoreId === coreId,
        );
        if (!cfsProject) {
          expect.fail(`SHARC-FX ${coreId} project not found in cfsconfig`);
        }

        // The default-workspace-plugin's generated cfsconfig has no
        // AIModels entry by default, and the FX aimodels.mk template gates
        // its content on usesAIBackend("tflm"). Inject a real AIModels
        // entry targeting this core so aimodels.mk is guaranteed to contain
        // a TFLM path assignment.
        (cfsProject as ConfiguredProject & { AIModels: unknown[] }).AIModels =
          buildTflmAiModels(coreId);

        const socDataModel = JSON.parse(
          await fs.readFile(
            joinPath(
              "data-models",
              "socs",
              `${workspaceForCodeGen.soc.toLowerCase()}-${workspaceForCodeGen.package.toLowerCase()}.json`,
            ),
            "utf-8",
          ),
        ) as CfsSocDataModel;

        await codeGenService.runCodeGeneration(
          {
            pluginId: cfsProject.PluginId,
            cfsconfig: cfsConfig,
            projectId: cfsProject.ProjectId,
            coreId: cfsProject.CoreId,
          },
          socDataModel,
          joinPath(
            workspaceForCodeGen.location,
            workspaceForCodeGen.workspaceName,
          ),
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
          `aimodels.mk must build paths from ${variableName}`,
        ).to.include(`$(${variableName})`);

        // With an unmodified project.mk, nothing sets the path before
        // aimodels.mk, so its default (`?=`) value must win.
        expect(
          resolveMakeVariable(
            [projectMkContent, aimodelsMkContent],
            variableName,
          ),
        ).to.equal(defaultValue);

        // Simulate a project uncommenting/editing the generated example
        // override. This must survive being combined with aimodels.mk's
        // `?=` default, proving project-defined precedence is retained.
        const customTflmPath = "/custom/tflite-micro";
        const overriddenProjectMkContent = projectMkContent.replace(
          `# ${variableName} := /path/to/tflite-micro`,
          `${variableName} := ${customTflmPath}`,
        );
        expect(overriddenProjectMkContent).to.not.equal(
          projectMkContent,
          `project.mk must contain the expected commented ${variableName} example line`,
        );
        expect(
          resolveMakeVariable(
            [overriddenProjectMkContent, aimodelsMkContent],
            variableName,
          ),
        ).to.equal(customTflmPath);
      });
    }
  });

  describe("GenerateCode_TflmProfiling_ShouldGateCycleCountDefinitions", () => {
    for (const [projectDir, coreId] of [
      ["sfx", "FX"],
      ["m33", "CM33"],
    ] as const) {
      it(`Should emit the ${coreId} cycle-count definitions only inside the ENABLE_TFLM_PROFILING guard`, async () => {
        const workspaceForCodeGen: CfsWorkspace = {
          workspacePluginId: "test-plugin-id",
          workspacePluginVersion: "1.0.0",
          workspaceName: `tflm-profiling-${coreId.toLowerCase()}-test`,
          location: "tests/unit-tests/plugins/sharcfx-project-plugin/data",
          copyrightDate: new Date().getFullYear().toString(),
          dataModelVersion: "1.0.0",
          dataModelSchemaVersion: "1.0.0",
          package: "BGA_ED",
          timestamp: new Date().toISOString(),
          board: "ADSPSC835W-EV-SOM",
          soc: "ADSP-SC835",
          projects: [
            {
              id: `${projectDir}-project-id`,
              name: projectDir,
              coreId,
              path: `./${projectDir}`,
              pluginId: "com.analog.project.sharcfx.plugin",
              pluginVersion: "1.1.0",
              firmwarePlatform: "SHARC-FX",
              isEnabled: true,
              platformConfig: { ProjectName: projectDir },
            },
          ],
        } as CfsWorkspace;

        await workspacePlugin.generateWorkspace(workspaceForCodeGen);

        const workspacePath = joinPath(
          workspaceForCodeGen.location,
          workspaceForCodeGen.workspaceName,
        );
        const projectPath = joinPath(workspacePath, projectDir);

        await projectPlugin.generateProject(projectPath, {
          id: `${projectDir}-project-id`,
          package: "BGA_ED",
          board: "ADSPSC835W-EV-SOM",
          soc: "ADSP-SC835",
          name: projectDir,
          copyrightDate: new Date().getFullYear().toString(),
          path: workspacePath,
          pluginId: "com.analog.project.sharcfx.plugin",
          pluginVersion: "1.1.0",
          pluginConfig: {},
          coreId,
          platformConfig: { ProjectName: projectDir },
        } as CfsProject);

        const cfsConfigPath = joinPath(
          workspacePath,
          ".cfs",
          `${workspaceForCodeGen.workspaceName}.cfsconfig`,
        );
        const cfsConfig = JSON.parse(
          await fs.readFile(cfsConfigPath, "utf-8"),
        ) as CfsConfig;

        const cfsProject = cfsConfig.Projects.find(
          (candidate) =>
            candidate.PluginId === "com.analog.project.sharcfx.plugin" &&
            candidate.CoreId === coreId,
        );
        if (!cfsProject) {
          expect.fail(`SHARC-FX ${coreId} project not found in cfsconfig`);
        }

        // aimodels.mk only emits TFLM content when the project declares a TFLM model.
        (cfsProject as ConfiguredProject & { AIModels: unknown[] }).AIModels =
          buildTflmAiModels(coreId);

        const socDataModel = JSON.parse(
          await fs.readFile(
            joinPath(
              "data-models",
              "socs",
              `${workspaceForCodeGen.soc.toLowerCase()}-${workspaceForCodeGen.package.toLowerCase()}.json`,
            ),
            "utf-8",
          ),
        ) as CfsSocDataModel;

        await new CodeGenerationService().runCodeGeneration(
          {
            pluginId: cfsProject.PluginId,
            cfsconfig: cfsConfig,
            projectId: cfsProject.ProjectId,
            coreId: cfsProject.CoreId,
          },
          socDataModel,
          workspacePath,
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
          resolveMakeVariable([projectMkContent], "ENABLE_TFLM_PROFILING"),
          "profiling must default to disabled for projects created from the project plugin",
        ).to.equal("0");

        const guardedBlocks = aimodelsMkContent
          .split("ifeq ($(ENABLE_TFLM_PROFILING),1)")
          .slice(1)
          .map((block) => block.slice(0, block.indexOf("endif")));
        expect(
          guardedBlocks.length,
          "aimodels.mk must gate profiling on ENABLE_TFLM_PROFILING",
        ).to.equal(1);

        const [flagsBlock] = guardedBlocks;
        expect(flagsBlock).to.include("CFLAGS += -DENABLE_TFLM_PROFILING");
        expect(flagsBlock).to.include("CXXFLAGS += -DENABLE_TFLM_PROFILING");

        // The ADI kernel cycle logs print from inside the operator invocation, which
        // would dominate anything measured around Invoke().
        expect(aimodelsMkContent).to.not.include("-DDISPLAY_CYCLE_COUNTS");
        expect(aimodelsMkContent).to.not.include("debug.c");

        // With profiling disabled nothing outside the guard may define the macro.
        const unguardedContent = guardedBlocks.reduce(
          (content, block) => content.replace(block, ""),
          aimodelsMkContent,
        );
        expect(unguardedContent).to.not.include("-DENABLE_TFLM_PROFILING");
      });
    }
  });

  describe("GenerateCode_SSDD_ShouldGeneratePeripheralOutputs", () => {
    interface PeripheralAllocation {
      Name: string;
      Signals: unknown[];
      Config: Record<string, unknown>;
    }

    const ssddPeripherals = (): PeripheralAllocation[] => [
      {
        Name: "CANFD0",
        Signals: [],
        Config: {
          ENABLE_FDMODE: "TRUE",
          PREDIV: "11",
        },
      },
      {
        Name: "CANFD1",
        Signals: [],
        Config: {
          MDMASTREAMID: "MDMA_STREAM_6_USED",
          ENABLE_FDMODE: "TRUE",
        },
      },
      {
        Name: "PDM0",
        Signals: [],
        Config: {
          CTL0_CH01_EN: "TRUE",
          CTL0_DEC_RATIO: "32_X",
        },
      },
      {
        Name: "PDM1",
        Signals: [],
        Config: {
          CTL0_CH23_EN: "TRUE",
          CTL0_DEC_RATIO: "16_X",
        },
      },
    ];

    const readGeneratedCfsConfig = async (
      workspace: CfsWorkspace,
    ): Promise<CfsConfig> => {
      const workspacePath = joinPath(
        workspace.location,
        workspace.workspaceName,
      );
      const candidates = [
        joinPath(workspacePath, ".cfs", `${workspace.workspaceName}.cfsconfig`),
        joinPath(
          workspacePath,
          ".cfs",
          `${workspace.soc.toLowerCase()}-${workspace.package.toLowerCase()}.cfsconfig`,
        ),
      ];

      for (const candidate of candidates) {
        if (await fileExists(candidate)) {
          return JSON.parse(await fs.readFile(candidate, "utf-8")) as CfsConfig;
        }
      }

      expect.fail(`No generated cfsconfig found in ${workspacePath}`);
    };

    const findProjectByCore = (
      cfsConfig: CfsConfig,
      coreId: string,
    ): ConfiguredProject => {
      const project = cfsConfig.Projects.find(
        (candidate) =>
          candidate.PluginId === "com.analog.project.sharcfx.plugin" &&
          candidate.CoreId === coreId,
      );
      if (!project) {
        expect.fail(`SHARC-FX ${coreId} project not found in cfsconfig`);
      }
      return project;
    };

    const generateSsddProject = async (
      coreId: "FX" | "M33",
      peripherals: PeripheralAllocation[] = ssddPeripherals(),
    ) => {
      const projectName = coreId === "FX" ? "sfx" : "m33";
      const workspaceForCodeGen: CfsWorkspace = {
        workspacePluginId: "test-plugin-id",
        workspacePluginVersion: "1.0.0",
        workspaceName: `ssdd-${projectName.toLowerCase()}-codegen-test`,
        location: "tests/unit-tests/plugins/sharcfx-project-plugin/data",
        copyrightDate: new Date().getFullYear().toString(),
        dataModelVersion: "1.0.0",
        dataModelSchemaVersion: "1.0.0",
        package: "BGA_ED",
        timestamp: new Date().toISOString(),
        board: "ADSPSC835W-EV-SOM",
        soc: "ADSP-SC835W",
        projects: [
          {
            id: `${projectName}-project-id`,
            name: projectName,
            coreId,
            path: `./${projectName}`,
            pluginId: "com.analog.project.sharcfx.plugin",
            pluginVersion: "1.1.0",
            firmwarePlatform: "SHARC-FX",
            isEnabled: true,
            platformConfig: { ProjectName: projectName },
          },
        ],
      } as CfsWorkspace;

      await workspacePlugin.generateWorkspace(workspaceForCodeGen);

      const workspacePath = joinPath(
        workspaceForCodeGen.location,
        workspaceForCodeGen.workspaceName,
      );
      const projectPath = joinPath(workspacePath, projectName);
      const project = {
        ...(coreId === "FX" ? sfxProject : m33Project),
        id: `${projectName}-project-id`,
        name: projectName,
        path: workspacePath,
        coreId,
        platformConfig: { ProjectName: projectName },
      } as CfsProject;

      await projectPlugin.generateProject(projectPath, project);

      const cfsConfig = await readGeneratedCfsConfig(workspaceForCodeGen);
      const configuredProject = findProjectByCore(
        cfsConfig,
        coreId,
      ) as ConfiguredProject & { Peripherals?: PeripheralAllocation[] };
      configuredProject.Peripherals = peripherals;

      const socDataModel = JSON.parse(
        await fs.readFile(
          joinPath(
            "data-models",
            "socs",
            `${workspaceForCodeGen.soc.toLowerCase()}-${workspaceForCodeGen.package.toLowerCase()}.json`,
          ),
          "utf-8",
        ),
      ) as CfsSocDataModel;

      await new CodeGenerationService().runCodeGeneration(
        {
          pluginId: configuredProject.PluginId,
          cfsconfig: cfsConfig,
          projectId: configuredProject.ProjectId,
          coreId: configuredProject.CoreId,
        },
        socDataModel,
        workspacePath,
      );

      return { workspacePath, projectPath };
    };

    for (const [coreId, paths] of [
      [
        "FX",
        {
          canfdHeader: "include/ssdd/drivers/canfd/adi_canfd_config_SC8xx.h",
          pdmHeader: "include/ssdd/services/pdm/adi_pdm_config_SC8xx.h",
          absentCanfdHeader: "include/ssdd/adi_canfd_config_SC8xx.h",
          absentPdmHeader: "include/ssdd/adi_pdm_config_SC8xx.h",
        },
      ],
      [
        "M33",
        {
          canfdHeader: "include/ssdd/adi_canfd_config_SC8xx.h",
          pdmHeader: "include/ssdd/adi_pdm_config_SC8xx.h",
          absentCanfdHeader:
            "include/ssdd/drivers/canfd/adi_canfd_config_SC8xx.h",
          absentPdmHeader: "include/ssdd/services/pdm/adi_pdm_config_SC8xx.h",
        },
      ],
    ] as const) {
      it(`Should generate config.mk, SSDD headers, and selected sources for ${coreId}`, async () => {
        const { projectPath } = await generateSsddProject(coreId);
        const configMkContent = await fs.readFile(
          joinPath(projectPath, "config.mk"),
          "utf-8",
        );
        const canfdHeaderContent = await fs.readFile(
          joinPath(projectPath, paths.canfdHeader),
          "utf-8",
        );
        const pdmHeaderContent = await fs.readFile(
          joinPath(projectPath, paths.pdmHeader),
          "utf-8",
        );

        expect(configMkContent).to.include(
          "EXTERNAL_INCLUDE_DIRS += include/ssdd",
        );
        expect(configMkContent).to.include(
          "SSDD_C_SRCS += $(SSDD_DRIVER_BASE)/canfd/adi_canfd.c",
        );
        expect(configMkContent).to.include(
          "SSDD_C_SRCS += $(SSDD_SERVICE_BASE)/pdm/adi_pdm.c",
        );
        expect(configMkContent).to.not.include(
          "SSDD_C_SRCS += $(SSDD_DRIVER_BASE)/uart/adi_uart.c",
        );

        expect(
          await fileExists(joinPath(projectPath, paths.canfdHeader)),
        ).to.equal(true);
        expect(
          await fileExists(joinPath(projectPath, paths.pdmHeader)),
        ).to.equal(true);
        expect(
          await fileExists(joinPath(projectPath, paths.absentCanfdHeader)),
        ).to.equal(false);
        expect(
          await fileExists(joinPath(projectPath, paths.absentPdmHeader)),
        ).to.equal(false);

        expect(canfdHeaderContent).to.include(
          "#define ADI_CANFD_CFG_INSTANCES          2UL",
        );
        expect(canfdHeaderContent).to.include(
          "#define ADI_CANFD0_CFG_ENABLE_FDMODE         1U",
        );
        expect(canfdHeaderContent).to.include(
          "#define ADI_CANFD0_CFG_PREDIV\t\t\t\t 11U",
        );
        expect(canfdHeaderContent).to.include(
          "#define ADI_CANFD1_CFG_MDMAUSE                1U",
        );
        expect(canfdHeaderContent).to.include(
          "#define ADI_CANFD1_CFG_MDMASTREAMID           6U",
        );
        expect(canfdHeaderContent).to.include(
          "#define ADI_CANFD1_CFG_ENABLE_FDMODE         1U",
        );

        expect(pdmHeaderContent).to.include(
          "#define ADI_PDM0_INSTANCE                     1ul",
        );
        expect(pdmHeaderContent).to.include(
          "#define ADI_PDM1_INSTANCE                     1ul",
        );
        expect(pdmHeaderContent).to.include(
          "#define ADI_PDM0_CTL0_CH01_EN\t\t\t\t\t(1u)",
        );
        expect(pdmHeaderContent).to.include(
          "#define ADI_PDM0_CTL0_DEC_RATIO                 (1u)",
        );
        expect(pdmHeaderContent).to.include(
          "#define ADI_PDM1_CTL0_CH23_EN                   (1u)",
        );
        expect(pdmHeaderContent).to.include(
          "#define ADI_PDM1_CTL0_DEC_RATIO                 (2u)",
        );
      });
    }

    it("Should compile the GPIO service source when a PORT GPIO pin is assigned", async () => {
      // PORT instances use letter suffixes (PORTA…PORTE), so adi_gpio.c is
      // gated on the character-instance form of anyInstanceAssigned.
      const { projectPath } = await generateSsddProject("FX", [
        {
          Name: "PORTB",
          Signals: [{ Name: "PB_00", Description: "Position 0" }],
          Config: {},
        },
      ]);
      const configMkContent = await fs.readFile(
        joinPath(projectPath, "config.mk"),
        "utf-8",
      );

      expect(configMkContent).to.include(
        "SSDD_C_SRCS += $(SSDD_SERVICE_BASE)/gpio/adi_gpio.c",
      );
    });

    it("Should clear SSDD settings from config.mk when all peripherals are removed", async () => {
      await generateSsddProject("FX");
      const { projectPath } = await generateSsddProject("FX", []);
      const configMkContent = await fs.readFile(
        joinPath(projectPath, "config.mk"),
        "utf-8",
      );

      expect(configMkContent).to.not.include("SSDD_BASE");
      expect(configMkContent).to.not.include("SSDD_C_SRCS");
      expect(configMkContent).to.not.include("EXTERNAL_INCLUDE_DIRS");
      expect(await fileExists(joinPath(projectPath, "include"))).to.equal(
        false,
      );
    });

    it("Should remove stale SSDD headers when peripheral allocations change", async () => {
      await generateSsddProject("FX");
      const { projectPath } = await generateSsddProject("FX", [
        { Name: "UART0", Signals: [], Config: {} },
      ]);

      expect(
        await fileExists(
          joinPath(
            projectPath,
            "include/ssdd/drivers/uart/adi_uart_config_SC8xx.h",
          ),
        ),
      ).to.equal(true);
      expect(
        await fileExists(
          joinPath(
            projectPath,
            "include/ssdd/drivers/canfd/adi_canfd_config_SC8xx.h",
          ),
        ),
      ).to.equal(false);
      expect(
        await fileExists(
          joinPath(
            projectPath,
            "include/ssdd/services/pdm/adi_pdm_config_SC8xx.h",
          ),
        ),
      ).to.equal(false);
    });

    it("Should not delete SSDD headers outside the code generation directory", async () => {
      const root = joinPath(cfsWorkspace.location, "traversal");
      const baseDir = joinPath(root, "base");
      const outsideHeader = joinPath(
        root,
        "outside",
        "include",
        "ssdd",
        "adi_marker.h",
      );
      await fs.mkdir(baseDir, { recursive: true });
      await fs.mkdir(path.dirname(outsideHeader), { recursive: true });
      await fs.writeFile(outsideHeader, "");

      const plugin = new SharcFxProjectPlugin(projectPluginInfo);
      let error: unknown;
      try {
        await plugin.generateCode(
          {
            projectId: "id",
            cfsconfig: {
              Projects: [
                {
                  ProjectId: "id",
                  PlatformConfig: { ProjectName: "../outside" },
                },
              ],
            },
          },
          baseDir,
        );
      } catch (e) {
        error = e;
      }

      expect(error).to.be.instanceOf(Error);
      expect(await fileExists(outsideHeader)).to.equal(true);
    });

    it("Should generate Makefile dependency hooks for regenerated SSDD inputs", async () => {
      const { projectPath } = await generateSsddProject("M33");
      const makefileContent = await fs.readFile(
        joinPath(projectPath, "Makefile"),
        "utf-8",
      );

      expect(makefileContent).to.include("DEPFLAGS = -MMD -MP");
      expect(makefileContent).to.include("DEP_FILES = $(ALL_OBJS:.o=.d)");
      expect(makefileContent).to.include(
        "CONFIGMK_DEPS = $(wildcard $(CONFIGMK))",
      );
      expect(makefileContent).to.include("-include $(DEP_FILES)");
      expect(makefileContent).to.include(
        "$(OBJ_DIR)/ext/$(call normalize_path,$(dir $(1)))$(notdir $(patsubst %.c,%.o,$(1))): $(1) $(CONFIGMK_DEPS)",
      );
      expect(makefileContent).to.include(
        "$(ELF): $(ALL_OBJS) $(LD_SCRIPT) $(CONFIGMK_DEPS) | $(BUILD_DIR)",
      );
      expect(makefileContent).to.include(
        "LINK_INPUT_FILE = $(BUILD_DIR)/input-file.txt",
      );
      expect(makefileContent).to.include("$(Q)$(LD) @$(LINK_INPUT_FILE)");
    });
  });
});
