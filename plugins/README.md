# Reference Plugins for CodeFusion Studio

This directory contains default and reference plugins for [CodeFusion Studio](https://www.analog.com/en/resources/evaluation-hardware-and-software/embedded-development-software/codefusion-studio.html).

## 🧩 Understanding Plugin Structure

A CodeFusion Studio plugin is defined entirely by the services in its `.cfsplugin` file.

```json
{
  "features": {
    "workspace": {
      /* … */
    },
    "project": {
      /* … */
    },
    "codegen": {
      /* … */
    }
  },
  "properties": {
    /* … */
  }
}
```

- A plugin can provide one or more of the following services:
  - `workspace`: Generates a workspace folder structure
  - `project`: Sets up per-core projects for a workspace
  - `codegen`: Generates files like `board.conf`, `.overlay`, etc.
  - `properties`: Defines UI form fields used by System Planner

By default, if no `index.ts` file is present, CodeFusion Studio uses the generic plugin implementation. Refer to `cfs-generic-plugin.ts` in the Plugin API. This implementation:

- Copies any files listed in `features.<name>.files` from the `files/` directory
- Renders templates listed in `features.<name>.templates` from the `templates/` directory using [Eta](https://eta.js.org/docs/) and the plugin context

To override this behavior, you can add an `index.ts` file that exports a class implementing one or more service interfaces defined in `cfs-services.ts` in the Plugin API, such as `CfsProjectGenerationService` and `CfsCodeGenerationService`. Your custom class can reuse generic plugin components, plug in a different templating engine, or define fully custom logic.

## SHARC-FX runtime source mapping

The SHARC-FX Makefiles call `.vscode/gen-xt-substitute-path.sh` during debug
preflight. The shared source is
[`common/sharcfx/scripts/gen-xt-substitute-path.sh`](common/sharcfx/scripts/gen-xt-substitute-path.sh);
Rollup packages it with each SHARC-FX plugin and the manifests copy it into SFX
projects. Update this helper rather than duplicating mapping logic in templates.
It scans `DEBUG_EXE` (defaulting to the local build's `DXE`), normalizes POSIX and
Windows source roots and toolchain destinations, accepts LF or CRLF DWARF output,
and atomically writes `.vscode/.xt-substitute-path.gdb`. Paths containing spaces
or double quotes are quoted for GDB.
Failed scans or scans without matching roots leave existing mappings intact.
A successful scan without matching roots creates an empty script if none exists,
so the first debug launch can still source it.

## 🖋 Eta templating

By default, templates in the `templates/` directory are rendered using the [Eta](https://eta.js.org/docs/) templating engine. Eta has access to the plugin context, which includes values from the selected SoC, board, and package. Templates can be used for any generated file, from workspace settings and launch configurations to task definitions.

Common examples include `.vscode/settings.json.eta`, `.code-workspace.eta`, and `cfs.tasks.json.eta`. All template files must be declared in `.cfsplugin` under the appropriate `features.<name>.templates` entry with a `src`/`dst` mapping.

You can use a different templating engine by providing a custom `index.ts` — see [Plugin Development Guide](../DEVELOPMENT.md).

For controlling which tasks appear in the **Actions** view in the CFS UI, see [Defining custom tasks with cfs.tasks.json](#-defining-custom-tasks-with-cfstasksjson).

## 🧪 Example: Plugin with `workspace` service

### [-single-core-blinky`](./zephyr-single-core-blinky/)

Provides a `workspace` service that defines a workspace layout for a single-core Zephyr application. This plugin **does not include custom logic**—it relies entirely on the generic plugin. See the `cfs-generic-plugin.ts` in the Plugin API reference for details.

**Contents:**

- **`.cfsplugin`**
  Declares a `workspace` service that includes:
  - `files` to be copied into the workspace
  - `templates` rendered using Eta (example templates: `.cfsconfig`, `.code-workspace`)

- **`files/`**
  Static assets copied as-is into the workspace.

- **`templates/`**
  Eta templates rendered dynamically using values from the selected SoC, board, and package.

> **Note**: All files must be listed in `.cfsplugin.features.workspace.files` or `.templates`. Static files are copied as-is. `.eta` files are processed as described in [Eta templating](#-eta-templating). The generator services determine how templates are rendered or files are transformed.

## 🧪 Example: Plugin with `project`, `codegen`, and `properties` services

### [`zephyr-project-plugin`](./zephyr-project-plugin/)

Provides logic for creating Zephyr-based projects and runtime configuration files. This plugin includes **custom service logic** through `index.ts`.

**Contents:**

- **`.cfsplugin`**
  Declares the following services:
  - `project`: Describes per-core project structure, files, and templates
  - `codegen`: Dynamically generates files like `board.conf` or `.overlay` using context from `.cfsconfig` and user selections.
  - `properties`: Defines fields shown in the System Planner UI, such as `ZephyrBoardName`, `BuildSystem`, and `KConfigFlags`, which are saved and reused in generation.

- **`index.ts`**
  Implements custom logic by exporting a class that satisfies one or more service interfaces defined in the Plugin API `cfs-services.ts`:

  ```ts
    class ZephyrProjectPlugin
      implements
        CfsProjectGenerationService,
        CfsCodeGenerationService,
        CfsPropertyProviderService,
        CfsSocControlsOverrideService,
        CfsProjectConfigService,
        CfsSystemConfigService
  ```

  Although this plugin defines its own service class, it delegates most behavior to reusable generic components found in the Plugin API:

  ```ts
  this.projectGenerator = new CfsEtaProjectGenerator(...)
  this.codeGenerator = new CfsEtaCodeGenerator(...)
  this.projectConfig = new CfsJsonProjectConfig(...)
  this.systemConfig = new CfsJsonSystemConfig(...)
  ```

  These components encapsulate common generation logic, which you can reuse, extend, or override in your own service implementations.

- **`files/`**
  Static files included in each project (such as base `CMakeLists.txt`and top-level project layout files). These are declared in `.cfsplugin.services.project.files`.

- **`templates/`**
  Contains two sets of templates:
  - Project setup templates (such as `CMakeLists.txt.eta` or `prj.conf.eta`)
  - Code generation templates (`board.conf.eta`, `project.overlay.eta`) used during System Planner export

- **`config-patches/`**
  Optional JSON files that override default SoC config (such as memory size and clock settings). See [Understanding `.cfsconfig`](#-understanding-cfsconfig) for details.

- **`services/`**
  Internal helpers like `property-provider.ts`, which define dynamic property logic and SoC-specific UI control overrides.

> **Note**
> The codegen service integrates with System Planner to generate runtime configuration files from selected hardware blocks. Templates access user-defined properties and SoC data from the plugin context.

> **Did you know?**
> You don’t need full custom logic to use codegen. A plugin can consist solely of a `.cfsplugin` file with a codegen service and a template — useful for generating overlays or config files without workspace or project scaffolding.

## 🗂 Understanding `.cfsconfig`

The `.cfsconfig` file captures the full configuration of a CodeFusion Studio workspace and its projects. Its structure is defined by the `cfs-config.ts` in the Plugin API, which is shared between the IDE, CLI, and all plugin services.

Sample `.cfsconfig` structure:

```json
{
  // IDE generated based on the user selection
  "Soc": "MAX32690",
  "BoardName": "AD-APARD32690-SL",
  "Package": "wlp",
  "Timestamp": "2025-02-28T12:29:03.185Z",
  "Projects": [
    {
      "CoreId": "CM4",
      "ProjectId": "m4",
      // Derived from the plugin that created the project
      "PluginId": "com.analog.project.zephyr.plugin",
      "PluginVersion": "1.1.0",
      "FirmwarePlatform": "zephyr",
      "PlatformConfig": {
        /* plugin-defined properties */
      },
      // IDE-generated from System Planner configuration and plugin overrides
      "Peripherals": [
        /* configured hardware blocks */
      ],
      "Partitions": [
        /* memory partitions */
      ]
    }
  ],
  "Pins": [
    /* configured pins */
  ],
  "ClockNodes": [
    /* configured clocks */
  ],
  "DFG": {
    /* data flow gasket config, if present */
  }
}
```

The file is generated automatically by the IDE using:

- The services declared in your plugin
- The selected SoC and board
- User input in the System Planner UI

Plugins can modify or extend its contents by:

- Declaring `properties` for the System Planner UI
- Applying system-wide overrides (`CfsSystemConfigService` + `config-patches/<soc>/system.json`)
- Applying project-wide overrides (`CfsProjectConfigService` + `config-patches/<soc>/<ProjectId>.json`)

### System-wide override example

```ts
async configureSystem(config: CfsConfig): Promise<CfsConfig> {
  // merge in any top-level overrides
  return this.systemConfig.configureSystem(config);
}
```

Under the hood, `CfsJsonSystemConfig` will look for `<plugin-root>/config-patches/<soc-id>/system.json` and overlay its fields onto the generated `config`.

### Project-wide override example

```ts
async configureProject(soc: string, config: ConfiguredProject): Promise<ConfiguredProject> {
  // merge in any per-core overrides
  return this.projectConfig.configureProject(soc, config);
}
```

Here, `CfsJsonProjectConfig` reads: `<plugin-root>/config-patches/<soc>/<ProjectId>.json` and merges its contents into the matching entry under `Projects[]`.

💡 The structure of `.cfsconfig` may evolve in future releases. Avoid hardcoding assumptions about its format in your plugin logic.

## 🔧 Defining custom tasks with cfs.tasks.json

A `cfs.tasks.json.eta` template controls which tasks appear in the **Actions** view in the CFS UI when a workspace is created. Without one, CFS falls back to a default view. With one, your plugin can hide tasks that are not supported for your target, or add entirely new ones.

For example, [msdk-multi-core-hello-world](./msdk-multi-core-hello-world/templates/cfs.tasks.json.eta) uses `if (!it.relativeFilePath.includes('riscv'))` to conditionally filter tasks in the Actions view for the RISC-V core. A plugin could equally add a custom task — such as opening SDK documentation — using a tool path variable to locate the installed SDK:

```json
{
  "label": "Open SDK Documentation",
  "type": "shell",
  "windows": {
    "command": "start \"\" \"${cfs:tool.path.<tool-name>}/doc/html/index.html\""
  },
  "linux": {
    "command": "xdg-open \"${cfs:tool.path.<tool-name>}/doc/html/index.html\""
  },
  "osx": {
    "command": "open \"${cfs:tool.path.<tool-name>}/doc/html/index.html\""
  },
  "problemMatcher": []
}
```

Replace `<tool-name>` with the tool identifier registered by your plugin (for example, `xtensa-sharcfx`).

CFS-specific variables such as `${config:cfs.project.target}`, `${config:cfs.programFile}`, and `${cfs:tool.path.<tool-name>}` are resolved automatically within task commands.

### SharcFX flash and erase tasks

SharcFX plugins generate **flash** and **erase** tasks in `cfs.tasks.json.eta` for programming SPI flash memory on supported boards. The project-plugin templates conditionally emit these tasks only when the project context includes a board (`hasBoard` guard). Workspace-template plugins declare only board-backed supported contexts and emit the tasks directly.

#### Toolchain

Flash operations use two tools from the Xtensa SharcFX toolchain (`${cfs:tool.path.xtensa-sharcfx}`):

| Tool                                    | Purpose                                                                                                                |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `elfloader`                             | Converts a core executable (`.dxe` for SFX or `.elf` for M33) into a `.ldr` binary loader image suitable for SPI flash |
| `cldp` (Command-Line Device Programmer) | Programs or erases flash memory via an emulator connection                                                             |

#### Flash command (two-stage pipeline)

The flash task chains `elfloader` and `cldp` with `&&`:

1. **elfloader** packages the built `.dxe` into a `.ldr` loader:

   ```text
   elfloader -proc <SoC> -si-revision any -bspi -fbinary -bcode 1 -core1="<dxe>" -o "<ldr>"
   ```

   The `-core1` flag is used for the SFX core; M33 templates use `-core2` instead.

2. **cldp** programs the loader to flash:

   ```text
   cldp -proc <SoC> -emu <emulator>
     -driver "<sdk>/Tools/openocd/share/openocd/scripts/board/flash_algorithms/2183x_flash.dxe"
     -board <boardConfig> -openocdroot "<sdk>/Tools/openocd" -verbose
     -cmd prog -file "<ldr>" -format bin -erase <eraseMode> -offset <offset>
   ```

#### Erase command

The erase task invokes `cldp` directly to wipe the entire flash:

```text
cldp -proc <SoC> -emu <emulator>
     -driver "<sdk>/Tools/openocd/share/openocd/scripts/board/flash_algorithms/2183x_flash.dxe"
  -board <boardConfig> -openocdroot "<sdk>/Tools/openocd" -verbose -cmd erase
```

#### Flash settings

The following VS Code settings are declared in each project's `settings.json.eta` and referenced by the flash/erase commands:

| Setting                      | Default    | Description                                                                     |
| ---------------------------- | ---------- | ------------------------------------------------------------------------------- |
| `cfs.<core>.flash.emulator`  | `2000`     | Emulator ID (extracted from the OpenOCD interface, e.g. `ice2000.cfg` → `2000`) |
| `cfs.<core>.flash.eraseMode` | `affected` | Erase scope for the flash command (`affected` or `all`)                         |
| `cfs.<core>.flash.offset`    | `0x0`      | Flash base address offset                                                       |

Where `<core>` is `sfx` for SHARC-FX projects and `arm` for Cortex-M33 projects.

#### Board configuration resolution

Board `.cfg` filenames are derived from the SoC and board name using the `@sharcfxBoardName` partial and an inflection-point function:

1. `sharcfxBoardNameInflectionPoint(soc)` maps the SoC to a base name (e.g., `ADSP-SC835W` → `adspsc835w`)
2. The `"sc"` prefix is replaced with `"21"` (e.g., `adspsc835w` → `adsp21835w`)
3. The board suffix from `getSharcFxBoardName()` is appended (e.g., `ev_som`)
4. Result: `adsp21835w_ev_som.cfg`

> **Note**: SoCs without a board entry in the `.cfsplugin` manifest (e.g., newer ADSP-2184x/SC84x parts) do not generate flash or erase tasks.

## 📄 Want to build your own plugin?

See the full development guide:
📄 [Plugin Development Guide](../DEVELOPMENT.md)
