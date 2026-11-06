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
import { compileFunction } from "node:vm";
import { expect } from "chai";
import { GenericPlugin } from "cfs-plugins-sdk";
import type { CfsWorkspace } from "cfs-types";
import { runWorkspacePluginSuite } from "@services/WorkspacePluginSuite.js";
import { joinPath } from "@utilities/path-utilities.js";
import {
  deleteCreatedWorkspace,
  isDebug,
  loadPluginInfo,
} from "@utilities/test-utilities.js";

const pluginInfo = await loadPluginInfo(
  "plugins/dist/sharcfx-multi-core-example/.cfsplugin",
);

// Every SoC this plugin supports is an ADSP-SC part, so both cores are always
// generated; the assertion still names them so a dropped core fails loudly.
const expectedSharcFxCoreIds = (): string[] => ["CM33", "FX"];

runWorkspacePluginSuite(pluginInfo, {
  suiteTitle: "SHARC-FX Multi-Core Hello World Tests",
  dataDir: "tests/unit-tests/plugins/sharcfx-multi-core-example/data",
  projects: [
    { name: "m33", path: "./m33" },
    { name: "sfx", path: "./sfx" },
  ],
  buildWorkspacePrefix: "hello",
  expectedWorkspaceFiles: [
    ".cfs/.cfsdependencies",
    ".cfs/.cfsworkspace",
    ".cfs/{{soc}}-{{package}}.cfsconfig",
    ".cfs/gdb_toolbox/configs/fault-analyzer.json",
    ".cfs/gdb_toolbox/configs/memory-dump.json",
    ".cfs/gdb_toolbox/configs/register-dump.json",
    ".cfs/gdb_toolbox/gdb/fault-analyzer-arm.gdb",
    ".cfs/gdb_toolbox/gdb/fault-analyzer-xtensa.gdb",
    ".cfs/gdb_toolbox/configs/fatal-error.json",
    ".cfs/gdb_toolbox/gdb/fatal-error-xtensa.gdb",
    "{{workspaceName}}.code-workspace",
    "m33/.vscode/c_cpp_properties.json",
    "m33/.vscode/cfs.tasks.json",
    "m33/.vscode/launch.json",
    "m33/.vscode/settings.json",
    "m33/.vscode/qemu-gdbserver.py",
    "m33/ADSP-SC83x.ld",
    "m33/Makefile",
    "m33/README.md",
    "m33/project.mk",
    "m33/src/main.c",
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
    {
      project: "m33",
      type: "executable",
      settingKey: "cfs.arm.artifactType",
      output: (p) => `build/${p}.elf`,
    },
    {
      project: "m33",
      type: "static_library",
      settingKey: "cfs.arm.artifactType",
      output: (p) => `build/lib${p}.a`,
    },
    {
      project: "m33",
      type: "binary",
      settingKey: "cfs.arm.artifactType",
      output: (p) => `build/${p}.bin`,
    },
    {
      project: "m33",
      type: "hex",
      settingKey: "cfs.arm.artifactType",
      output: (p) => `build/${p}.hex`,
    },
  ],
});

// Beyond the standard flow: content checks on the generated VS Code files
// (flash, artifact-type, QEMU and per-OS settings) that the shared file-shape
// validation cannot make.
describe("SHARC-FX Multi-Core Hello World Tests - workspace content", () => {
  it("should preserve literal apostrophes and shell syntax in QEMU POSIX arguments", async function () {
    if (process.platform === "win32") {
      this.skip();
    }

    const template = await fs.readFile(
      "plugins/common/sharcfx-qemu/templates/qemu-tasks.eta",
      "utf-8",
    );
    const posixCommand = compileFunction(
      `${template.slice(template.indexOf("<%") + 2, template.indexOf("%>"))}\nreturn posixCommand(command, args);`,
      ["command", "args"],
    ) as (command: string, args: string[]) => string;
    const args = [
      "/tmp/O'Brien",
      "a''b",
      "",
      "with spaces",
      "$HOME",
      "`printf unexpected`",
      "'; printf unexpected; '",
    ];

    const output = execFileSync(
      "/bin/sh",
      ["-c", posixCommand("printf", ["%s\\n", ...args])],
      { encoding: "utf-8" },
    );
    expect(output).to.equal(`${args.join("\n")}\n`);
  });

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

  describe("GenerateWorkspace_M33Makefile_ShouldGuardDfpPack", () => {
    it("Should discover the ADSP-SC83x DFP pack and guard its Source and Include directories", async () => {
      cfsWorkspace = {
        location: "tests/unit-tests/plugins/sharcfx-multi-core-example/data",
        workspacePluginId: pluginInfo.pluginId,
        workspacePluginVersion: pluginInfo.pluginVersion,
        workspaceName: "dfp-pack-test",
        copyrightDate: new Date().getFullYear().toString(),
        dataModelVersion: "1.0.0",
        package: "bga_ed",
        timestamp: new Date().toISOString(),
        board: "ADSPSC835W-EV-SOM",
        soc: "ADSP-SC835",
        projects: [
          { name: "sfx", path: "./sfx" },
          { name: "m33", path: "./m33" },
        ],
      };

      await genericPlugin.generateWorkspace(cfsWorkspace);

      const m33Makefile = await fs.readFile(
        joinPath(
          cfsWorkspace.location,
          cfsWorkspace.workspaceName,
          "m33",
          "Makefile",
        ),
        "utf-8",
      );

      expect(m33Makefile).to.include(
        "ADSP_SC83X_DFP_ROOT ?= $(patsubst %/Source/.,%,$(wildcard $(SDK_PATH)/packs/AnalogDevices/ADSP-SC83x_DFP/*/Source/.))",
      );
      expect(m33Makefile.replace(/\r\n/g, "\n")).to.include(
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
    });
  });

  describe("GenerateWorkspace_FlashTask_ShouldHaveCorrectConfiguration", () => {
    it("Should generate a flash task in SFX with elfloader→cldp command and build dependency", async () => {
      cfsWorkspace = {
        location: "tests/unit-tests/plugins/sharcfx-multi-core-example/data",
        workspacePluginId: pluginInfo.pluginId,
        workspacePluginVersion: pluginInfo.pluginVersion,
        workspaceName: "flash-task-test",
        copyrightDate: new Date().getFullYear().toString(),
        dataModelVersion: "1.0.0",
        package: "bga_ed",
        timestamp: new Date().toISOString(),
        board: "ADSPSC835W-EV-SOM",
        soc: "ADSP-SC835",
        projects: [
          { name: "sfx", path: "./sfx" },
          { name: "m33", path: "./m33" },
        ],
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
      expect(flashTask, "flash task should exist in SFX tasks").to.exist;
      expect(eraseTask, "erase task should exist in SFX tasks").to.exist;

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

    it("Should generate a flash task in M33 tasks", async () => {
      cfsWorkspace = {
        location: "tests/unit-tests/plugins/sharcfx-multi-core-example/data",
        workspacePluginId: pluginInfo.pluginId,
        workspacePluginVersion: pluginInfo.pluginVersion,
        workspaceName: "flash-task-test",
        copyrightDate: new Date().getFullYear().toString(),
        dataModelVersion: "1.0.0",
        package: "bga_ed",
        timestamp: new Date().toISOString(),
        board: "ADSPSC835W-EV-SOM",
        soc: "ADSP-SC835",
        projects: [
          { name: "sfx", path: "./sfx" },
          { name: "m33", path: "./m33" },
        ],
      };

      await genericPlugin.generateWorkspace(cfsWorkspace);

      const m33TasksJsonPath = joinPath(
        cfsWorkspace.location,
        cfsWorkspace.workspaceName,
        "m33",
        ".vscode/cfs.tasks.json",
      );
      const tasksContent = await fs.readFile(m33TasksJsonPath, "utf-8");
      const tasksJson = JSON.parse(tasksContent);

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

      const m33SettingsJsonPath = joinPath(
        cfsWorkspace.location,
        cfsWorkspace.workspaceName,
        "m33",
        ".vscode/settings.json",
      );
      const settingsContent = await fs.readFile(m33SettingsJsonPath, "utf-8");
      const settings = JSON.parse(settingsContent);

      expect(settings["cfs.arm.flash.eraseMode"]).to.equal("affected");
      expect(settings["cfs.arm.flash.emulator"]).to.equal("2000");
      expect(settings["cfs.arm.flash.offset"]).to.equal("0x0");

      expect(flashTask.command).to.include(
        "${workspaceFolderBasename}.elf",
        "M33 flash task must reference .elf in -core2 argument",
      );
      expect(settings["cfs.programFile"]).to.equal(
        "${workspaceFolder}/build/${workspaceFolderBasename}.elf",
        "M33 programFile must use .elf extension",
      );

      const m33MakefilePath = joinPath(
        cfsWorkspace.location,
        cfsWorkspace.workspaceName,
        "m33",
        "Makefile",
      );
      const makefileContent = await fs.readFile(m33MakefilePath, "utf-8");
      expect(makefileContent).to.include(
        "ELF = $(BUILD_DIR)/$(PROJECT).elf",
        "M33 Makefile must define ELF variable with .elf extension",
      );
      expect(makefileContent).to.include(
        "-o $(ELF)",
        "M33 Makefile linker must emit the declared ELF target",
      );
    });
  });

  describe("GenerateWorkspace_ArtifactType_ShouldGenerateCorrectMakefile", () => {
    it("Should generate M33 Makefile with .DEFAULT_GOAL set to all", async () => {
      cfsWorkspace = {
        location: "tests/unit-tests/plugins/sharcfx-multi-core-example/data",
        workspacePluginId: pluginInfo.pluginId,
        workspacePluginVersion: pluginInfo.pluginVersion,
        workspaceName: "artifact-type-makefile-test",
        copyrightDate: new Date().getFullYear().toString(),
        dataModelVersion: "1.0.0",
        package: "bga_ed",
        timestamp: new Date().toISOString(),
        board: "ADSPSC835W-EV-SOM",
        soc: "ADSP-SC835",
        projects: [
          { name: "sfx", path: "./sfx" },
          { name: "m33", path: "./m33" },
        ],
      };

      await genericPlugin.generateWorkspace(cfsWorkspace);

      const makefilePath = joinPath(
        cfsWorkspace.location,
        cfsWorkspace.workspaceName,
        "m33",
        "Makefile",
      );
      const makefileContent = await fs.readFile(makefilePath, "utf-8");

      expect(makefileContent).to.include(".DEFAULT_GOAL := all");
    });

    it("Should generate M33 Makefile with ARTIFACT_TYPE defaulting to executable", async () => {
      cfsWorkspace = {
        location: "tests/unit-tests/plugins/sharcfx-multi-core-example/data",
        workspacePluginId: pluginInfo.pluginId,
        workspacePluginVersion: pluginInfo.pluginVersion,
        workspaceName: "artifact-type-makefile-test",
        copyrightDate: new Date().getFullYear().toString(),
        dataModelVersion: "1.0.0",
        package: "bga_ed",
        timestamp: new Date().toISOString(),
        board: "ADSPSC835W-EV-SOM",
        soc: "ADSP-SC835",
        projects: [
          { name: "sfx", path: "./sfx" },
          { name: "m33", path: "./m33" },
        ],
      };

      await genericPlugin.generateWorkspace(cfsWorkspace);

      const makefilePath = joinPath(
        cfsWorkspace.location,
        cfsWorkspace.workspaceName,
        "m33",
        "Makefile",
      );
      const makefileContent = await fs.readFile(makefilePath, "utf-8");

      expect(makefileContent).to.include("ARTIFACT_TYPE ?= executable");
      expect(makefileContent).to.include("all: link");
    });

    it("Should generate M33 Makefile with all artifact type dispatch targets", async () => {
      cfsWorkspace = {
        location: "tests/unit-tests/plugins/sharcfx-multi-core-example/data",
        workspacePluginId: pluginInfo.pluginId,
        workspacePluginVersion: pluginInfo.pluginVersion,
        workspaceName: "artifact-type-makefile-test",
        copyrightDate: new Date().getFullYear().toString(),
        dataModelVersion: "1.0.0",
        package: "bga_ed",
        timestamp: new Date().toISOString(),
        board: "ADSPSC835W-EV-SOM",
        soc: "ADSP-SC835",
        projects: [
          { name: "sfx", path: "./sfx" },
          { name: "m33", path: "./m33" },
        ],
      };

      await genericPlugin.generateWorkspace(cfsWorkspace);

      const makefilePath = joinPath(
        cfsWorkspace.location,
        cfsWorkspace.workspaceName,
        "m33",
        "Makefile",
      );
      const makefileContent = await fs.readFile(makefilePath, "utf-8");

      expect(makefileContent).to.include(
        "ifeq ($(ARTIFACT_TYPE),static_library)",
      );
      expect(makefileContent).to.include("all: $(LIB)");
      expect(makefileContent).to.include("else ifeq ($(ARTIFACT_TYPE),binary)");
      expect(makefileContent).to.include("all: $(BIN)");
      expect(makefileContent).to.include("else ifeq ($(ARTIFACT_TYPE),hex)");
      expect(makefileContent).to.include("all: $(HEX)");
      expect(makefileContent).to.include("all: link");
    });

    it("Should generate M33 Makefile with binary and hex conversion targets", async () => {
      cfsWorkspace = {
        location: "tests/unit-tests/plugins/sharcfx-multi-core-example/data",
        workspacePluginId: pluginInfo.pluginId,
        workspacePluginVersion: pluginInfo.pluginVersion,
        workspaceName: "artifact-type-makefile-test",
        copyrightDate: new Date().getFullYear().toString(),
        dataModelVersion: "1.0.0",
        package: "bga_ed",
        timestamp: new Date().toISOString(),
        board: "ADSPSC835W-EV-SOM",
        soc: "ADSP-SC835",
        projects: [
          { name: "sfx", path: "./sfx" },
          { name: "m33", path: "./m33" },
        ],
      };

      await genericPlugin.generateWorkspace(cfsWorkspace);

      const makefilePath = joinPath(
        cfsWorkspace.location,
        cfsWorkspace.workspaceName,
        "m33",
        "Makefile",
      );
      const makefileContent = await fs.readFile(makefilePath, "utf-8");

      expect(makefileContent).to.include("OBJCOPY = arm-none-eabi-objcopy");
      expect(makefileContent).to.include("$(OBJCOPY) -O binary");
      expect(makefileContent).to.include("$(OBJCOPY) -O ihex");
    });

    it("Should generate SFX Makefile with ARTIFACT_TYPE defaulting to executable", async () => {
      cfsWorkspace = {
        location: "tests/unit-tests/plugins/sharcfx-multi-core-example/data",
        workspacePluginId: pluginInfo.pluginId,
        workspacePluginVersion: pluginInfo.pluginVersion,
        workspaceName: "artifact-type-makefile-test",
        copyrightDate: new Date().getFullYear().toString(),
        dataModelVersion: "1.0.0",
        package: "bga_ed",
        timestamp: new Date().toISOString(),
        board: "ADSPSC835W-EV-SOM",
        soc: "ADSP-SC835",
        projects: [
          { name: "sfx", path: "./sfx" },
          { name: "m33", path: "./m33" },
        ],
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
        location: "tests/unit-tests/plugins/sharcfx-multi-core-example/data",
        workspacePluginId: pluginInfo.pluginId,
        workspacePluginVersion: pluginInfo.pluginVersion,
        workspaceName: "artifact-type-makefile-test",
        copyrightDate: new Date().getFullYear().toString(),
        dataModelVersion: "1.0.0",
        package: "bga_ed",
        timestamp: new Date().toISOString(),
        board: "ADSPSC835W-EV-SOM",
        soc: "ADSP-SC835",
        projects: [
          { name: "sfx", path: "./sfx" },
          { name: "m33", path: "./m33" },
        ],
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
    it("Should include cfs.arm.artifactType in M33 settings", async () => {
      cfsWorkspace = {
        location: "tests/unit-tests/plugins/sharcfx-multi-core-example/data",
        workspacePluginId: pluginInfo.pluginId,
        workspacePluginVersion: pluginInfo.pluginVersion,
        workspaceName: "artifact-type-settings-test",
        copyrightDate: new Date().getFullYear().toString(),
        dataModelVersion: "1.0.0",
        package: "bga_ed",
        timestamp: new Date().toISOString(),
        board: "ADSPSC835W-EV-SOM",
        soc: "ADSP-SC835",
        projects: [
          { name: "sfx", path: "./sfx" },
          { name: "m33", path: "./m33" },
        ],
      };

      await genericPlugin.generateWorkspace(cfsWorkspace);

      const settingsPath = joinPath(
        cfsWorkspace.location,
        cfsWorkspace.workspaceName,
        "m33",
        ".vscode/settings.json",
      );
      const settings = JSON.parse(await fs.readFile(settingsPath, "utf-8"));

      expect(settings["cfs.arm.artifactType"]).to.equal("executable");
    });

    it("Should include cfs.sfx.artifactType in SFX settings", async () => {
      cfsWorkspace = {
        location: "tests/unit-tests/plugins/sharcfx-multi-core-example/data",
        workspacePluginId: pluginInfo.pluginId,
        workspacePluginVersion: pluginInfo.pluginVersion,
        workspaceName: "artifact-type-settings-test",
        copyrightDate: new Date().getFullYear().toString(),
        dataModelVersion: "1.0.0",
        package: "bga_ed",
        timestamp: new Date().toISOString(),
        board: "ADSPSC835W-EV-SOM",
        soc: "ADSP-SC835",
        projects: [
          { name: "sfx", path: "./sfx" },
          { name: "m33", path: "./m33" },
        ],
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
    it("Should pass ARTIFACT_TYPE to M33 build task", async () => {
      cfsWorkspace = {
        location: "tests/unit-tests/plugins/sharcfx-multi-core-example/data",
        workspacePluginId: pluginInfo.pluginId,
        workspacePluginVersion: pluginInfo.pluginVersion,
        workspaceName: "artifact-type-tasks-test",
        copyrightDate: new Date().getFullYear().toString(),
        dataModelVersion: "1.0.0",
        package: "bga_ed",
        timestamp: new Date().toISOString(),
        board: "ADSPSC835W-EV-SOM",
        soc: "ADSP-SC835",
        projects: [
          { name: "sfx", path: "./sfx" },
          { name: "m33", path: "./m33" },
        ],
      };

      await genericPlugin.generateWorkspace(cfsWorkspace);

      const tasksJsonPath = joinPath(
        cfsWorkspace.location,
        cfsWorkspace.workspaceName,
        "m33",
        ".vscode/cfs.tasks.json",
      );
      const tasksJson = JSON.parse(await fs.readFile(tasksJsonPath, "utf-8"));

      const buildTask = tasksJson.tasks.find(
        (task: { label: string }) => task.label === "build",
      );
      expect(buildTask, "build task should exist in M33 tasks").to.exist;
      expect(buildTask.command).to.include(
        "ARTIFACT_TYPE=${config:cfs.arm.artifactType}",
      );
    });

    it("Should pass ARTIFACT_TYPE to SFX build task", async () => {
      cfsWorkspace = {
        location: "tests/unit-tests/plugins/sharcfx-multi-core-example/data",
        workspacePluginId: pluginInfo.pluginId,
        workspacePluginVersion: pluginInfo.pluginVersion,
        workspaceName: "artifact-type-tasks-test",
        copyrightDate: new Date().getFullYear().toString(),
        dataModelVersion: "1.0.0",
        package: "bga_ed",
        timestamp: new Date().toISOString(),
        board: "ADSPSC835W-EV-SOM",
        soc: "ADSP-SC835",
        projects: [
          { name: "sfx", path: "./sfx" },
          { name: "m33", path: "./m33" },
        ],
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

  describe("GenerateWorkspace_QemuTasks_ShouldHaveCorrectPlatformCommands", () => {
    const readM33QemuTasks = async () => {
      cfsWorkspace = {
        location: "tests/unit-tests/plugins/sharcfx-multi-core-example/data",
        workspacePluginId: pluginInfo.pluginId,
        workspacePluginVersion: pluginInfo.pluginVersion,
        workspaceName: "qemu-task-test",
        copyrightDate: new Date().getFullYear().toString(),
        dataModelVersion: "1.0.0",
        package: "bga_ed",
        timestamp: new Date().toISOString(),
        board: "ADSPSC835W-EV-SOM",
        soc: "ADSP-SC835",
        projects: [
          { name: "sfx", path: "./sfx" },
          { name: "m33", path: "./m33" },
        ],
      };

      await genericPlugin.generateWorkspace(cfsWorkspace);

      const tasksJsonPath = joinPath(
        cfsWorkspace.location,
        cfsWorkspace.workspaceName,
        "m33",
        ".vscode/cfs.tasks.json",
      );
      const tasksContent = await fs.readFile(tasksJsonPath, "utf-8");
      const tasksJson = JSON.parse(tasksContent);

      const findTask = (label: string) => {
        const task = tasksJson.tasks.find(
          (candidate: { label: string }) => candidate.label === label,
        );
        expect(task, `${label} task should exist in M33 tasks`).to.exist;
        return task;
      };

      return {
        startTask: findTask("Start QEMU GDB Server"),
        stopTask: findTask("Stop QEMU GDB Server"),
        tailTask: findTask("QEMU: tail stdout"),
      };
    };

    it("Should not define a top-level command or args that would defeat the platform overrides", async () => {
      const { startTask, stopTask, tailTask } = await readM33QemuTasks();

      [startTask, stopTask, tailTask].forEach((task) => {
        expect(task.command).to.be.undefined;
        expect(task.args).to.be.undefined;
      });
    });

    it("Should wrap the Windows commands in an outer quote pair stripped by cmd.exe /c", async () => {
      const { startTask, stopTask } = await readM33QemuTasks();

      expect(startTask.windows.command).to.equal(
        '""${config:cfs.sdk.path}/Tools/python/python.exe" ' +
          '"${workspaceFolder}/.vscode/qemu-gdbserver.py" "start" ' +
          '"--qemu-path" ' +
          '"${cfs:tool.path.cortex-m-sharcfx}/qemu/qemu-system-aarch32.exe" ' +
          '"--program-path" "${config:cfs.programFile}""',
      );
      expect(stopTask.windows.command).to.equal(
        '""${config:cfs.sdk.path}/Tools/python/python.exe" ' +
          '"${workspaceFolder}/.vscode/qemu-gdbserver.py" "stop""',
      );
    });

    it("Should single-quote the Unix command so resolved paths are not shell-expanded", async () => {
      const { startTask, stopTask } = await readM33QemuTasks();

      expect(startTask.linux.command).to.equal(
        "'${config:cfs.sdk.path}/Tools/python/bin/python' " +
          "'${workspaceFolder}/.vscode/qemu-gdbserver.py' 'start' " +
          "'--qemu-path' " +
          "'${cfs:tool.path.cortex-m-sharcfx}/qemu/bin/qemu-system-aarch32' " +
          "'--program-path' '${config:cfs.programFile}'",
      );
      expect(stopTask.linux.command).to.equal(
        "'${config:cfs.sdk.path}/Tools/python/bin/python' " +
          "'${workspaceFolder}/.vscode/qemu-gdbserver.py' 'stop'",
      );
    });

    it("Should keep the PowerShell override for the tail task on Windows only", async () => {
      const { tailTask } = await readM33QemuTasks();

      expect(tailTask.windows.command).to.equal(
        "powershell -NoProfile -ExecutionPolicy Bypass -Command " +
          "\"Get-Content -LiteralPath '.vscode/.qemu.stdout.log' -Tail 200 -Wait\"",
      );
      expect(tailTask.linux.command).to.equal(
        "'tail' '-F' '-n' '200' '${workspaceFolder}/.vscode/.qemu.stdout.log'",
      );
    });
  });

  describe("GenerateWorkspace_LinuxSupport_ShouldHaveCorrectPlatformSettings", () => {
    it("Should generate SFX tasks.json with Windows and Linux environment settings", async () => {
      cfsWorkspace = {
        location: "tests/unit-tests/plugins/sharcfx-multi-core-example/data",
        workspacePluginId: pluginInfo.pluginId,
        workspacePluginVersion: pluginInfo.pluginVersion,
        workspaceName: "linux-support-test",
        copyrightDate: new Date().getFullYear().toString(),
        dataModelVersion: "1.0.0",
        package: "bga_ed",
        timestamp: new Date().toISOString(),
        board: "ADSPSC835W-EV-SOM",
        soc: "ADSP-SC835",
        projects: [
          { name: "sfx", path: "./sfx" },
          { name: "m33", path: "./m33" },
        ],
      };

      await genericPlugin.generateWorkspace(cfsWorkspace);

      const sfxTasksJsonPath = joinPath(
        cfsWorkspace.location,
        cfsWorkspace.workspaceName,
        "sfx",
        ".vscode/cfs.tasks.json",
      );

      const tasksContent = await fs.readFile(sfxTasksJsonPath, "utf-8");
      const tasksJson = JSON.parse(tasksContent);

      expect(tasksJson.tasks).to.be.an("array").with.length.greaterThan(0);

      const buildTask = tasksJson.tasks[0];

      // Windows settings
      expect(buildTask.windows).to.exist;
      expect(buildTask.windows.options.env.PATH).to.include(";");
      expect(buildTask.windows.options.env.SHELL).to.equal("sh.exe");
      expect(buildTask.windows.options.shell.executable).to.include("cmd.exe");
      expect(buildTask.windows.options.shell.args).to.deep.equal(["/c"]);

      // Linux settings
      expect(buildTask.linux).to.exist;
      expect(buildTask.linux.options.env.PATH).to.not.include(";");
      expect(buildTask.linux.options.env.PATH).to.include("xtensa-sharcfx");
      expect(buildTask.linux.options.env.SHELL).to.equal("/bin/sh");
      expect(buildTask.linux.options.shell).to.not.exist;
    });

    it("Should generate M33 tasks.json with Windows and Linux environment settings", async () => {
      cfsWorkspace = {
        location: "tests/unit-tests/plugins/sharcfx-multi-core-example/data",
        workspacePluginId: pluginInfo.pluginId,
        workspacePluginVersion: pluginInfo.pluginVersion,
        workspaceName: "linux-support-test",
        copyrightDate: new Date().getFullYear().toString(),
        dataModelVersion: "1.0.0",
        package: "bga_ed",
        timestamp: new Date().toISOString(),
        board: "ADSPSC835W-EV-SOM",
        soc: "ADSP-SC835",
        projects: [
          { name: "sfx", path: "./sfx" },
          { name: "m33", path: "./m33" },
        ],
      };

      await genericPlugin.generateWorkspace(cfsWorkspace);

      const m33TasksJsonPath = joinPath(
        cfsWorkspace.location,
        cfsWorkspace.workspaceName,
        "m33",
        ".vscode/cfs.tasks.json",
      );

      const tasksContent = await fs.readFile(m33TasksJsonPath, "utf-8");
      const tasksJson = JSON.parse(tasksContent);

      expect(tasksJson.tasks).to.be.an("array").with.length.greaterThan(0);

      const buildTask = tasksJson.tasks[0];

      // Windows settings
      expect(buildTask.windows).to.exist;
      expect(buildTask.windows.options.env.PATH).to.include(";");
      expect(buildTask.windows.options.env.SHELL).to.equal("sh.exe");
      expect(buildTask.windows.options.shell.executable).to.include("cmd.exe");
      expect(buildTask.windows.options.shell.args).to.deep.equal(["/c"]);

      // Linux settings
      expect(buildTask.linux).to.exist;
      expect(buildTask.linux.options.env.PATH).to.not.include(";");
      expect(buildTask.linux.options.env.PATH).to.include(
        "arm.none.eabi.toolchain",
      );
      expect(buildTask.linux.options.env.SHELL).to.equal("/bin/sh");
      expect(buildTask.linux.options.shell).to.not.exist;
    });

    it("Should generate SFX launch.json with OS-specific debugger sequences", async () => {
      cfsWorkspace = {
        location: "tests/unit-tests/plugins/sharcfx-multi-core-example/data",
        workspacePluginId: pluginInfo.pluginId,
        workspacePluginVersion: pluginInfo.pluginVersion,
        workspaceName: "linux-support-test",
        copyrightDate: new Date().getFullYear().toString(),
        dataModelVersion: "1.0.0",
        package: "bga_ed",
        timestamp: new Date().toISOString(),
        board: "ADSPSC835W-EV-SOM",
        soc: "ADSP-SC835",
        projects: [
          { name: "sfx", path: "./sfx" },
          { name: "m33", path: "./m33" },
        ],
      };

      await genericPlugin.generateWorkspace(cfsWorkspace);

      const sfxLaunchJsonPath = joinPath(
        cfsWorkspace.location,
        cfsWorkspace.workspaceName,
        "sfx",
        ".vscode/launch.json",
      );

      const launchContent = await fs.readFile(sfxLaunchJsonPath, "utf-8");
      const launchJson = JSON.parse(launchContent);

      const config = launchJson.configurations[0];

      expect(config.overrideLaunchCommands).to.deep.equal(["load"]);
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

      const windowsPythonCmd = config.windows.preLaunchCommands.find(
        (cmd: string) => cmd.includes("python"),
      );
      expect(windowsPythonCmd).to.include("Tools/python/python");

      // Linux override
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

    it("Should generate SFX c_cpp_properties.json with Default configuration", async () => {
      cfsWorkspace = {
        location: "tests/unit-tests/plugins/sharcfx-multi-core-example/data",
        workspacePluginId: pluginInfo.pluginId,
        workspacePluginVersion: pluginInfo.pluginVersion,
        workspaceName: "linux-support-test",
        copyrightDate: new Date().getFullYear().toString(),
        dataModelVersion: "1.0.0",
        package: "bga_ed",
        timestamp: new Date().toISOString(),
        board: "ADSPSC835W-EV-SOM",
        soc: "ADSP-SC835",
        projects: [
          { name: "sfx", path: "./sfx" },
          { name: "m33", path: "./m33" },
        ],
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

      const configNames = propsJson.configurations.map(
        (c: { name: string }) => c.name,
      );
      expect(configNames).to.include("Default");

      for (const config of propsJson.configurations) {
        expect(config.compilerPath).to.equal(
          "${env:cfs.project.toolchain.path}/ccfx++",
        );
        expect(config.intelliSenseMode).to.equal("clang-arm64");

        const hasXtensaPath = config.includePath.some((p: string) =>
          p.includes("Xtensa/SHARC-FX"),
        );
        expect(hasXtensaPath).to.be.true;
      }
    });
  });
});
