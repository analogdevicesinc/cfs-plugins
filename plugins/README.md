# Reference Plugins for CodeFusion Studio

This directory contains default and reference plugins for [CodeFusion Studio](https://www.analog.com/en/resources/evaluation-hardware-and-software/embedded-development-software/codefusion-studio.html).

## 🧩 Understanding Plugin Structure

A CodeFusion Studio plugin is defined entirely by the services in its `.cfsplugin` file.

  ```json
  {
    "features": {
      "workspace": { /* … */ },
      "project":   { /* … */ },
      "codegen":   { /* … */ }
    },
    "properties": { /* … */ }
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

## 🧪 Example: Plugin with `workspace` service

### [-single-core-blinky`](./zephyr-single-core-blinky/)

Provides a `workspace` service that defines a workspace layout for a single-core Zephyr application. This plugin **does not include custom logic**—it relies entirely on the generic plugin. See the `cfs-generic-plugin.ts` in the Plugin API reference for details.

**Contents:**

- **`.cfsplugin`**
  Declares a `workspace` service that includes:
  - `files` to be copied into the workspace
  - `templates` rendered using Eta (example templates: `.cfsconfig`or `.code-workspace`)

- **`files/`**
  Static assets copied as-is into the workspace.

- **`templates/`**
  Eta templates rendered dynamically using values from the selected SoC, board, and package.

> **Note**: All files must be listed in `.cfsplugin.features.workspace.files` or `.templates`.
> Static files are copied as-is. Templates (such as `.vscode/settings.json.eta`) are processed using the Eta templating engine by default. You can use another templating engine if preferred.
> The generator services determine how templates are rendered or files are transformed.

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
  {  // IDE generated based on the user selection
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
        "PluginVersion": "1.0.0",
        "FirmwarePlatform": "zephyr",
        "PlatformConfig": { /* plugin-defined properties */ },
         // IDE-generated from System Planner configuration and plugin overrides
        "Peripherals": [ /* configured hardware blocks */ ],
        "Partitions": [ /* memory partitions */ ]
      }
    ],
    "Pins": [ /* configured pins */ ],
    "ClockNodes": [ /* configured clocks */ ],
    "DFG": { /* data flow gasket config, if present */ }
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

## 📄 Want to build your own plugin?

See the full development guide:
📄 [Plugin Development Guide](../DEVELOPMENT.md)
