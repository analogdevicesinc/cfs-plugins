# CodeFusion Studio Plugin API

The CodeFusion Studio (CFS) Plugin API provides a dynamic interface for generating workspace, project and configuration code in [CodeFusion Studio](https://www.analog.com/en/resources/evaluation-hardware-and-software/embedded-development-software/codefusion-studio.html).

The Plugin API uses TypeScript for the plugin definitions and transpiles to CommonJS.

The plugins are dynamically loaded by CodeFusion Studio at runtime. For more information on how the plugins interface with CodeFusion Studio, refer to the [CodeFusion Studio User Guide](https://developer.analog.com/docs/codefusion-studio/latest/user-guide/plugins/plugin-integration-overview/).

## Get Started

See [DEVELOPMENT.md](../DEVELOPMENT.md)

## Plugin Structure

Each plugin resides in its own directory and includes:

- A `.cfsplugin` file that declares metadata and services.
- An optional `index.ts` (compiled to `index.cjs`) to override default behavior
- Optional `files/` and `templates/` directories used during generation

> **Note**
> If you rely on the default plugin infrastructure [`cfs-services.ts`](./src/types/cfs-services.ts), files in the `templates` directory are processed using [Eta](https://eta.js.org/docs/). If you define your own plugin logic in `index.ts`, you're free to use any templating engine or code generation strategy.

### .cfsplugin File

This file defines the plugin’s metadata and the services it implements. In many cases, it's the only file you need to create a functioning plugin. Fields include:

- `pluginId`, `pluginName`, `pluginVersion`
- `supportedSoCs`, `supportedBoards`, etc.
- A `features` block that declares one or more of:
  - `workspace`
  - `project`
  - `codegen`
- A `properties` block that defines plugin properties that are displayed in the System Planner.

See [cfs-plugin-info.ts](./src/types/cfs-plugin-info.ts) for the full schema.

A plugin that only includes a `.cfsplugin` file (with no `index.ts`) will be constructed using a generic plugin instance ([`cfs-generic-plugin.ts`](./src/generic/cfs-generic-plugin.ts), which uses [Eta](https://eta.js.org/docs/) as the default templating engine for rendering files during project and code generation.

### Service Implementation

Plugins can override default behavior by exporting a class from `index.ts`. This class must implement one or more service interfaces defined in [`cfs-services.ts`](./src/types/cfs-services.ts), such as `CfsWorkspaceGenerationService` or `CfsProjectGenerationService`. A single plugin can provide multiple services by implementing the corresponding interfaces.

You can construct a custom class using the generic components provided in [`api/src/generic/components`](./src/generic/components/), or define your own service implementations from scratch. For example, you might replace the default Eta-based code generator with a different templating engine, as long as your implementation satisfies the required service interface (`cfs-services.ts`).

### Plugin Properties

Plugins can define custom configuration fields for the System Planner UI. These properties are shown to the user during workspace or project setup and are saved in `.cfsworkspace` or `.cfsconfig` files.

You can define properties in one of two ways:

- Declaratively, by adding a `properties` block under the relevant service in the `.cfsplugin` file.
- Programmatically, by implementing the `CfsPropertyProviderService` interface in `index.ts`.

At runtime, all declared properties are collected and passed to the plugin’s code generation logic as part of the context.

See [`CfsPluginProperty`](./src/types/cfs-plugin-property.ts) for supported fields and usage.