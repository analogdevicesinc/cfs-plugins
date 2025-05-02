
# CodeFusion Studio Plugins

The CodeFusion Studio (CFS) Plugin API enables users to extend key features of [CodeFusion Studio](https://www.analog.com/en/resources/evaluation-hardware-and-software/embedded-development-software/codefusion-studio.html), such as workspace setup, project configuration, and source code generation — without modifying the base application.

With the Plugin API, you can develop custom plugins tailored to your project’s needs—for example, upgrading an RTOS version, integrating middleware, or generating code from proprietary templates.

This repository includes:

- 📦 The CFS Plugin API: [`./api`](./api/README.md)
- 🧩 A library of default and reference plugins: [`./plugins`](./plugins/README.md)

To learn how to create your own plugin, see:  
📄 [`DEVELOPMENT.md`](DEVELOPMENT.md)

---

## 🔌 Plugin Types

| Type        | Purpose                                                                                   |
|-------------|-------------------------------------------------------------------------------------------|
| Workspace   | Sets up a complete workspace with pre-configured structure and settings                  |
| Project     | Defines how a single core/project is structured and configured                                |
| Codegen     | Generates source files based on hardware configuration and user selections               |


> 💡 Codegen plugins are often **included inside** project plugins using the `codegen` section of `.cfsplugin`.

For information on using CFS Plugins in CFS, refer to the [CFS User Guide](https://developer.analog.com/docs/codefusion-studio/latest/user-guide/plugins). 

---

## 🧠 How Plugins Work

1. The **`.cfsplugin`** file describes the plugin's metadata, supported SoCs, and specifies which files and templates should be generated. CodeFusion Studio reads this file to determine when and how the plugin is used.
1. The `index.ts` file exports a class that extends `CfsPlugin`. This class defines the plugin's behavior by implementing `getGenerator()` and optionally `getService()`.
1. Files are either copied as-is from the `files/` directory or rendered using a templating engine from the `templates/` directory.
1. Reusable logic can be placed in a `services/` directory and made available via the `getService()` method.

---

## 🧩 Example Plugins

- **Workspace plugin:** [`zephyr41-single-core-blinky`](./plugins/zephyr41-single-core-blinky/)
- **Project plugin (with codegen):** [`zephyr41-project-plugin`](./plugins/zephyr41-project-plugin/)

You can also reuse helpers in the [`common/`](./plugins/common/) directory, including:
- [Eta](https://eta.js.org/)-based generators (`CfsEtaWorkspaceGenerator`)
- File handling utilities
- Reusable service classes

---

## 📂 Plugin Structure Overview

```
my-plugin/
├── .cfsplugin         # Describes plugin features and file/template outputs
├── index.ts           # Main logic file (compiled to index.cjs)
├── files/             # Static files to be copied into generated workspaces
├── templates/         # Eta templates rendered based on user context
└── services/          # Optional: helper logic exposed via getService()
```

For a full step-by-step guide to creating a plugin, see [`DEVELOPMENT.md`](./DEVELOPMENT.md)
