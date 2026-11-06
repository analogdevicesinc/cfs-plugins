## Description

This is a very simple example using TFLM on the ARM M33 core. It will use a model to predict sine values then compare them with the correct value.

## Build Artifact Types

The default artifact type is `executable`. Override it via `make ARTIFACT_TYPE=<type>` or change `cfs.arm.artifactType` in `.vscode/settings.json`.

| Type             | Output           | Description            |
| ---------------- | ---------------- | ---------------------- |
| `executable`     | `<project>.elf`  | Linked executable      |
| `static_library` | `lib<project>.a` | Static archive         |
| `binary`         | `<project>.bin`  | Raw binary via objcopy |
| `hex`            | `<project>.hex`  | Intel HEX via objcopy  |
