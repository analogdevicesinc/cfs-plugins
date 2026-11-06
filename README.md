# CodeFusion Studio Plugins

The CodeFusion Studio (CFS) Plugins enable users to extend key features of [CodeFusion Studio](https://www.analog.com/en/resources/evaluation-hardware-and-software/embedded-development-software/codefusion-studio.html), such as workspace setup, project configuration, and source code generation — without modifying the base application.

With the help of the Plugins SDK (included as a dependency for the base plugins), you can develop custom plugins tailored to your project’s needs—for example, upgrading an RTOS version, integrating middleware, or generating code from proprietary templates.

This repository includes:

- 🧩 Reference plugins: [`./plugins`](./plugins/README.md)
- 📄 Development guide: [`DEVELOPMENT.md`](DEVELOPMENT.md)

---

## 🔌 Plugin Architecture

Plugins are defined in their `.cfsplugin` file. Each plugin can implement one or more of the following services:

- **`workspace`** – Defines the folder structure and configuration of a generated workspace.
- **`project`** – Configures individual project cores within the workspace.
- **`codegen`** – Generates dynamic files such as `board.conf` or `.overlay` based on hardware selections.
- **`properties`** – Declares user-configurable fields in the System Planner UI.

See `cfs-services.ts` in the [`cfs-plugins-sdk`](https://github.com/analogdevicesinc/codefusion-studio) for a full interface list.

> 💡 Codegen plugins are often **included inside** project plugins using the `codegen` section of `.cfsplugin`.

For information on using CFS Plugins in CFS, refer to the [CFS User Guide](https://developer.analog.com/docs/codefusion-studio/latest/user-guide/plugins).

---

## 🧠 How Plugins Work

1. **Plugin Discovery**
   CodeFusion Studio reads your `.cfsplugin` to identify the offered services and supported SoCs/boards.

2. **Default Behavior (Generic Plugin)**
   If there's no `index.ts`/`index.cjs`, the default generic plugin implementation (`cfs-generic-plugin.ts`) in the [`cfs-plugins-sdk`](https://github.com/analogdevicesinc/codefusion-studio) uses [Eta](https://eta.js.org/) to render anything under `templates/`.

3. **Custom Logic (Optional)**
   Add an `index.ts` exporting a class that implements one or more service interfaces (see `cfs-services.ts`).
   You can:
   - **Reuse** the built-in components in `src/generic/components` in the `cfs-plugins-sdk`, or
   - **Use your own** from scratch (for example: swap out Eta a different engine).

4. **Static and Template Files**
   Each plugin can include:
   - **`files/`** → copied verbatim into the workspace
   - **`templates/`** → rendered by [Eta](https://eta.js.org/) (unless you override it in your `index.ts`)
     _All entries must be declared in your `.cfsplugin` under the appropriate service block._

---

## 🧩 Example Plugins

- **[`zephyr-single-core-blinky`](./plugins/zephyr-single-core-blinky/)** – Only implements the `workspace` service. No `index.ts` needed—uses generic behavior.
- **[`zephyr-project-plugin`](./plugins/zephyr-project-plugin/)** – Combines `project`, `codegen`, and `properties` services and ships an `index.ts` that implements all the required service interfaces.

---

## ⚙️ SharcFX Plugins

The repository includes a set of SharcFX plugins for ADSP-SC83x and ADSP-2183x processors:

- **[`sharcfx-project-plugin`](./plugins/sharcfx-project-plugin/)** – Project and code generation for SHARC-FX workspaces. Implements `project`, `codegen`, and `properties` services.
- **[`sharcfx-multi-core-example`](./plugins/sharcfx-multi-core-example/)** – Multi-core Hello World template (SHARC-FX core 1 + ARM M33 core 2).
- **[`sharcfx-multi-core-tflm-on-m33`](./plugins/sharcfx-multi-core-tflm-on-m33/)** – Multi-core template with TensorFlow Lite Micro on the ARM M33 core.
- **[`sharcfx-single-core-example`](./plugins/sharcfx-single-core-example/)** – Single-core Hello World template (SHARC-FX only).
- **[`sharcfx-single-core-tflm`](./plugins/sharcfx-single-core-tflm/)** – Single-core template with TensorFlow Lite Micro on SHARC-FX.

### Build Artifact Types

SharcFX projects support multiple build artifact types. To change the artifact type, set `cfs.sfx.artifactType` for an SFX project or `cfs.arm.artifactType` for an M33 project in `.vscode/settings.json`, then run the **build** task. You can also override it on the command line:

```bash
make ARTIFACT_TYPE=static_library
```

#### SFX Core (SHARC-FX / Xtensa)

| Type                   | Output           | Description       |
| ---------------------- | ---------------- | ----------------- |
| `executable` (default) | `<project>.dxe`  | Linked executable |
| `static_library`       | `lib<project>.a` | Static archive    |

#### M33 Core (ARM Cortex-M33)

| Type                   | Output           | Description                                      |
| ---------------------- | ---------------- | ------------------------------------------------ |
| `executable` (default) | `<project>.elf`  | Linked executable                                |
| `static_library`       | `lib<project>.a` | Static archive                                   |
| `binary`               | `<project>.bin`  | Raw binary via objcopy (builds executable first) |
| `hex`                  | `<project>.hex`  | Intel HEX via objcopy (builds executable first)  |

Run `make help` inside a generated project for a full list of available targets.

---

## 📂 Plugin Structure Overview

```markdown
my-plugin/
├── .cfsplugin # Required: Declares plugin metadata, services, and output files/templates
├── index.ts # Optional: Overrides default behavior
├── files/ # Optional: Static files (must be listed)
├── templates/ # Optional: Eta templates (must be listed)
└── services/ # Optional: helper classes for your `index.ts`
```

For a full step-by-step guide to creating a plugin, see [`DEVELOPMENT.md`](./DEVELOPMENT.md)
