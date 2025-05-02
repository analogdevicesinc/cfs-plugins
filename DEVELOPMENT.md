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

`yarn build:api`

To build only the plugins:

`yarn build:plugins`

## Creating Your First Plugin

The default plugins provided by [./plugins](./plugins/README.md) are a useful reference when creating your first plugin.

> 💡 You can also copy and adapt an existing plugin, like `zephyr41-single-core-blinky`, to save time.  
> Just remember to update the `pluginVersion` in `.cfsplugin` so CodeFusion Studio detects your changes.

1. **Create a new directory**

    Each plugin must be contained within its own directory. For example: [zephyr41-single-core-blinky](./plugins/zephyr41-single-core-blinky/).
1. **Create a .cfsplugin file**

   The .cfsplugin file defines details such as the plugin name and version, supported SoCs and boards, configuration properties, and the files and templates to include. CodeFusion Studio reads the .cfsplugin file to determine where it should be used in the workflow.

1. **Create `index.ts`**

   CodeFusion Studio dynamically loads the exported [`CfsPlugin`](./api/src/cfs-plugin.ts) class from `index.ts`.

   Your class should:
   - Extend `CfsPlugin`
   - Implement `getGenerator()` for the supported feature scopes
   - Optionally implement `getService()` to return reusable helper logic
   - Optionally implement `getEnvironmentVariables()`

   The CfsPlugin implementation must provide `CfsGenerators` through the `getGenerator` API based on the feature scope supported by the plugin and defined by the `.cfsplugin` file. Plugins can provide multiple generator types.

1. **Add supporting files and templates**

   - Place static files (copied as-is) under a `files/` directory
   - Place Eta templates (processed at generation) under a `templates/` directory
   - List both in the `.cfsplugin` under `files` and `templates`

1. **Update `package.json`**

   - Add a script to copy your plugin into `plugins/dist`
   - Append it to the `copy-files` chain to ensure it’s included in builds

1. **Build the plugin**

   From the repository root, run:

   ```bash
   yarn build
   ```

   > 💡 Use `yarn build:plugins` to build only the plugin layer

1. **Test the plugin**

   We recommend testing plugins using [Mocha](https://mochajs.org/).

   - Create tests under `tests/unit-tests/plugins/my-plugin/`
   - Run all tests with:

   ```bash
   yarn test
   ```

1. **Use the plugin in CFS**

   After building and testing, add the plugin’s path to your CodeFusion Studio `settings.json`:

   ```json
   "cfs.plugins.searchDirectories": [
     "${userHome}/cfs/plugins",
     "/your/path/to/plugins/dist"
   ]
   ```

   > For additional information refer to the [CFS User Guide](https://developer.analog.com/docs/codefusion-studio/latest/user-guide/plugins/develop-plugins/).