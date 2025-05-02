# CodeFusion Studio Plugin API

The CodeFusion Studio (CFS) Plugin API provides a dynamic interface for generating workspace, project and configuration code in [CodeFusion Studio](https://www.analog.com/en/resources/evaluation-hardware-and-software/embedded-development-software/codefusion-studio.html).

The Plugin API uses TypeScript for the plugin definitions and transpiles to CommonJS.

The plugins are dynamically loaded by CodeFusion Studio at runtime. For more information on how the plugins interface with CodeFusion Studio, refer to the [CodeFusion Studio User Guide](https://developer.analog.com/docs/codefusion-studio/1.1.0/user-guide/plugins/plugin-integration-overview/).

## Get Started

See [DEVELOPMENT.md](../DEVELOPMENT.md)

## Plugin Structure

Each plugin is expected to live in its own directory with a `.cfsplugin` file that describes the plugin, an `index.cjs` file containing the exported `CfsPlugin`, and optional files and templates to be copied during workspace, project or code generation.

### .cfsplugin File

The .cfsplugin file describes the plugin's attributes and features, including identifier (ID), name, version, etc. See [cfs-plugin-info.ts](./src/types/cfs-plugin-info.ts).

### Plugin Properties

The plugin properties allow flexible options in the CodeFusion Studio UI. The UI queries the plugin for all properties, then displays them to the user based on the option type. All user selections are stored in the `.cfsworkspace` or `.cfsconfig` file, then passed to the code generator plugin during workspace, project and code generation. See [cfs-plugin-property.ts](./src/types/cfs-plugin-property.ts).

### CfsPlugin Class

CodeFusion Studio dynamically loads the exported [CfsPlugin](./src/cfs-plugin.ts) class from `index.cjs`.

The CfsPlugin implementation must provide `CfsGenerators` through the `getGenerator` API based on the feature scope supported by the plugin and defined by the `.cfsplugin` file. Plugins can provide multiple generator types.
