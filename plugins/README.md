# Reference Plugins for CodeFusion Studio

This directory contains default and reference plugins for [CodeFusion Studio](https://www.analog.com/en/resources/evaluation-hardware-and-software/embedded-development-software/codefusion-studio.html).


## 🛠 Workspace Plugin

### [`zephyr41-single-core-blinky`](./zephyr41-single-core-blinky/)
A complete example of a **single-core Zephyr workspace**.

**Contents:**

- **`.cfsplugin`**  
  Describes the plugin metadata, supported SoCs, and generation logic.  
  It includes:
  - Plugin name, ID, version, firmware platform
  - Supported SoCs and optional System Planner data models
  - A `workspace` section with:
    - `files` to be copied into the generated workspace
    - `templates` rendered dynamically using Eta based on the selected SoC, board, and package

- **`index.ts`**  
  Extends `CfsPlugin` and implements `getGenerator()`, returning a `CfsEtaWorkspaceGenerator`. This defines how the workspace is created at runtime.

- **`files/`**  
  Contains static resources that are copied directly into the generated workspace. These are referenced in the `.cfsplugin` file under the `files` section.

- **`templates/`**  
  Contains Eta templates rendered with values from the generation context (such as selected SoC and board). These support logic-based generation of files like `.cfsconfig`, `.code-workspace`, and debug settings.

> **Note**  
> All files used during workspace generation must be defined in the `.cfsplugin` file.  
> Static files are copied as-is. Templates (such as `.vscode/settings.json.eta`) are processed using the Eta templating engine by default. You can use another templating engine if preferred.  
>  
> The `CfsGenerator` determines which services are used to render templates or transform files.

## 🛠 Project Plugin

### [`zephyr41-project-plugin`](./zephyr41-project-plugin/)  
A reference **Zephyr project plugin** used to configure per-core project logic and code generation.

**Contents:**

- **`.cfsplugin`**  

Extends the basic plugin metadata with support for project-level configuration and code generation.

In addition to standard fields, it introduces:
- **A `project` section**  
  Defines files and templates used to generate the structure of each project.

- **A `codegen` section**  
  Dynamically generates files like `board.conf` or `.overlay` using context from `.cfsconfig` and user selections.

- **A `properties` section**  
  Declares settings exposed in the CodeFusion Studio System Planner, such as `ZephyrBoardName`, `BuildSystem`, `KConfigFlags`, which are saved and reused in generation.

- **Optional hardware integration blocks**  
  `memory`, `pinConfig`, `clockConfig`, and `peripheral` customize available System Planner controls for supported SoCs.

- **`index.ts`**  
  Exports a class that extends `CfsCodeGenerationPlugin` and implements `getGenerator()`.

  - Returns a `CfsEtaProjectGenerator` to generate the project structure 
  - Returns a `CfsEtaCodeGenerator` to generate source code files using user selections and `.cfsconfig` context


- **`files/`**  
  Static files used for standard project setup. Referenced in the `.cfsplugin` under the `project.files` section.

- **`templates/`**  
  Contains two sets of templates:
  - Project setup templates (`CMakeLists.txt.eta`, `prj.conf.eta`, etc.)
  - Code generation templates (`board.conf.eta`, `project.overlay.eta`) used during System Planner export

> **Note**  
> The `codegen` feature enables integration with System Planner, generating configuration files from selected hardware settings. These templates can access plugin `context`, including user-defined properties and SoC-specific data models.  


## 🛠 Code Generation Plugin

You can also create a standalone codegen plugin by defining a `.cfsplugin` file with a codegen section and implementing an `index.ts` that returns a `CfsEtaCodeGenerator`—useful for generating configuration files based on hardware selections, even without a project feature.

 For information on developing plugins, see the full development guide:  
📄 [Plugin Development Guide](../DEVELOPMENT.md)