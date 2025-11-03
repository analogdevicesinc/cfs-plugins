# How to Start Developing CodeFusion Studio Plugins

## Dependencies

* [yarn](https://yarnpkg.com/)
* [NodeJS](https://nodejs.org/)

To install node dependencies, run:

`yarn install`

## Building the Plugin API

To build the plugins API and default plugins:

`yarn build`

To build only the plugins API:

`yarn ws:api build`

To build only the plugins:

`yarn ws:plugins build`

## Creating Your First Plugin

The default plugins provided by [./plugins](./plugins/README.md) are a useful reference when creating your first plugin.

> 💡 You can also copy and adapt an existing plugin, like `zephyr-single-core-blinky`, to save time.
> Just remember to update the `pluginVersion` in `.cfsplugin` so CodeFusion Studio detects your changes.

1. **Create a new directory**

    Each plugin must be contained within its own directory. For example: [zephyr-single-core-blinky](./plugins/zephyr-single-core-blinky/).

2. **Create a .cfsplugin file**

   This file is the only required component of a plugin. It defines:
   * The plugin's metadata (name, version, supported SoCs, etc.)
   * The services it provides (workspace, project, codegen, properties)
   * Output files and templates used by each service

   > 💡 If you provide a `.cfsplugin` file only (no `index.ts`), the plugin is automatically handled by the generic plugin implementation (defined in `cfs-generic-plugin.ts` in the Plugin API), which uses the [Eta](https://eta.js.org/docs/) templating engine to render templates.

3. **(Optional) Create `index.ts`**

   To override or extend the default behavior of any service, create an `index.ts`. It must export a class that implements one or more service interfaces from the Plugin API (`cfs-services.ts`), such as `CfsProjectGenerationService` or `CfsCodeGenerationService`.

   > 💡 You can build your implementation from scratch or reuse helper classes from `generic/components` in the Plugin API, such as `CfsEtaProjectGenerator`.

4. **Add supporting files and templates**

   * Place static files (copied as-is) under a `files/` directory
   * Place Eta templates (processed at generation) under a `templates/` directory
   * Declare them both in the `.cfsplugin` file under the relevant service (`workspace`, `project`, or `codegen`) using the `files` and `templates` arrays.

   > **Note**: The generic `cfs-generic-plugin.ts` implementation uses the [Eta](https://eta.js.org/docs/) templating engine, but you can use any templating engine or custom code generation logic by implementing your own generator class.

5. **Build the plugin**

   From the repository root, run:

   ```bash
   yarn build
   ```

   > 💡 Use `yarn ws:plugins build` to build only the plugin layer

6. **Test the plugin**

   We recommend testing plugins using [Mocha](https://mochajs.org/).

   * Create tests under `tests/unit-tests/plugins/my-plugin/`
   * Run all tests with:

   ```bash
   yarn test
   ```

7. **Use the plugin in CFS**

   After building and testing, add the plugin’s path to your CodeFusion Studio `settings.json`:

   ```json
   "cfs.plugins.searchDirectories": [
     "${userHome}/cfs/plugins",
     "/your/path/to/plugins/dist"
   ]
   ```

For additional information refer to the [CFS User Guide](https://developer.analog.com/docs/codefusion-studio/latest/user-guide/plugins/develop-plugins/).
