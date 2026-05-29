# How to Start Developing CodeFusion Studio Plugins

## Dependencies

- [yarn](https://yarnpkg.com/)
- [NodeJS](https://nodejs.org/)

To install node dependencies, run:

`yarn install`

## Building the Plugins

To build the plugins:

`yarn build`
or

`yarn ws:plugins build`

## Testing SDK modifications During Development

By default, `cfs-plugins-sdk` and `cfs-types` are fetched from the remote GitHub repository. There are two approaches to point to a specific version of the SDK during development:

- **[Option A: Yarn Portals](#option-a-yarn-portals-recommended)** — use a local checkout of the SDK on your machine.
- **[Option B: HTTPS URL with branch or commit](#option-b-https-url-with-branch-or-commit)** — use a specific remote branch or commit without a local clone.

---

### Option A: Yarn Portals (Recommended)

Use this approach when you are actively developing the SDK alongside this repo and want to see changes reflected immediately without pushing to GitHub.

#### Prerequisites

Clone the `codefusion-studio` repository alongside this one:

```
/home/<user>/code/
├── cfs-plugins/          ← this repo
└── codefusion-studio/    ← sdk repo
    └── packages/
        ├── cfs-plugins-sdk/
        └── cfs-types/
```

#### Configuration

1. **Update `plugins/package.json`** — replace the remote URL for `cfs-plugins-sdk` with a portal pointing to your local checkout:

   ```json
   "dependencies": {
     "cfs-plugins-sdk": "portal:../../codefusion-studio/packages/cfs-plugins-sdk"
   }
   ```

   The path is relative to the `plugins/` directory.

2. **Update the root `package.json` resolutions** — `cfs-plugins-sdk` declares `cfs-types` as `workspace:^` internally. Override it to point to your local `cfs-types`:

   ```json
   "resolutions": {
     "cfs-types@workspace:^": "portal:../codefusion-studio/packages/cfs-types"
   }
   ```

   The path here is relative to the **root** of this repo.

   > **Important:** Do not add `cfs-types` as a direct dependency in `plugins/package.json` as well — this causes a locator conflict with the resolution above. The resolution entry is sufficient.

3. **Run install:**

   ```bash
   yarn install
   ```

   A `YN0072` warning about `--preserve-symlinks` is expected and can be ignored — it does not affect the build.

---

### Option B: HTTPS URL with branch or commit

Use this approach to pin the SDK to a specific remote branch or commit without needing a local clone. Yarn supports a `#` fragment in GitHub HTTPS URLs to select a specific ref.

The URL format is:

`https://github.com/<org>/<repo>.git#workspace=<package-name>&commit=<sha>`

`https://github.com/<org>/<repo>.git#workspace=<package-name>&branch=<branch-name>`

#### Pin to a specific commit

1. **Update `plugins/package.json`:**

   ```json
   "dependencies": {
     "cfs-plugins-sdk": "https://github.com/analogdevicesinc/codefusion-studio.git#workspace=cfs-plugins-sdk&commit=<commit-sha>"
   }
   ```

2. **Update the root `package.json` resolutions:**

   ```json
   "resolutions": {
     "cfs-types@npm:^2.2.0": "https://github.com/analogdevicesinc/codefusion-studio.git#workspace=cfs-types&commit=<commit-sha>"
   }
   ```

#### Pin to a specific branch

1. **Update `plugins/package.json`:**

   ```json
   "dependencies": {
     "cfs-plugins-sdk": "https://github.com/analogdevicesinc/codefusion-studio.git#workspace=cfs-plugins-sdk&branch=<branch-name>"
   }
   ```

2. **Update the root `package.json` resolutions:**

   ```json
   "resolutions": {
     "cfs-types@npm:^2.2.0": "https://github.com/analogdevicesinc/codefusion-studio.git#workspace=cfs-types&branch=<branch-name>"
   }
   ```

   > **Note:** Using a branch ref is not reproducible — the lockfile will pin to the HEAD commit of that branch at install time. Prefer using a commit SHA for stability.

3. **Run install:**

   ```bash
   yarn install
   ```

## Creating Your First Plugin

The default plugins provided by [./plugins](./plugins/README.md) are a useful reference when creating your first plugin.

> 💡 You can also copy and adapt an existing plugin, like `zephyr-single-core-blinky`, to save time.
> Just remember to update the `pluginVersion` in `.cfsplugin` so CodeFusion Studio detects your changes.

1. **Create a new directory**

   Each plugin must be contained within its own directory. For example: [zephyr-single-core-blinky](./plugins/zephyr-single-core-blinky/).

2. **Create a .cfsplugin file**

   This file is the only required component of a plugin. It defines:
   - The plugin's metadata (name, version, supported SoCs, etc.)
   - The services it provides (workspace, project, codegen, properties)
   - Output files and templates used by each service

   > 💡 If you provide a `.cfsplugin` file only (no `index.ts`), the plugin is automatically handled by the generic plugin implementation (defined in `cfs-generic-plugin.ts` in the Plugin API), which uses the [Eta](https://eta.js.org/docs/) templating engine to render templates.

3. **(Optional) Create `index.ts`**

   To override or extend the default behavior of any service, create an `index.ts`. It must export a class that implements one or more service interfaces from the Plugin API (`cfs-services.ts`), such as `CfsProjectGenerationService` or `CfsCodeGenerationService`.

   > 💡 You can build your implementation from scratch or reuse helper classes from `generic/components` in the Plugin API, such as `CfsEtaProjectGenerator`.

4. **Add supporting files and templates**
   - Place static files (copied as-is) under a `files/` directory
   - Place Eta templates (processed at generation) under a `templates/` directory
   - Declare them both in the `.cfsplugin` file under the relevant service (`workspace`, `project`, or `codegen`) using the `files` and `templates` arrays.

   > **Note**: The generic `cfs-generic-plugin.ts` implementation uses the [Eta](https://eta.js.org/docs/) templating engine, but you can use any templating engine or custom code generation logic by implementing your own generator class.

5. **Build the plugin**

   From the repository root, run:

   ```bash
   yarn build
   ```

   > 💡 Use `yarn ws:plugins build` to build only the plugin layer

6. **Test the plugin**

   We recommend testing plugins using [Mocha](https://mochajs.org/).
   - Create tests under `tests/unit-tests/plugins/my-plugin/`
   - Run all tests with:

   ```bash
   yarn test
   ```

7. **Use the plugin in CFS**

   After building and testing, add the plugin’s path to your CodeFusion Studio `settings.json`:

   ```json
   "cfs.plugins.searchDirectories": [
     "${userHome}/cfs/plugins",
     "/your/path/to/cfs-plugins/plugins/dist"
   ]
   ```

For additional information refer to the [CFS User Guide](https://developer.analog.com/docs/codefusion-studio/latest/user-guide/plugins/develop-plugins/).
