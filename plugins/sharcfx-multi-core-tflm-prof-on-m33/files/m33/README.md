# SHARC-FX example
This is an example using a TensorFlow Lite Micro (TFLM) model on the ARM core and printing arena size, cycles and inference profiling information on the debug console.

## Build Artifact Types

The default artifact type is `executable`. Override it via `make ARTIFACT_TYPE=<type>` or change `cfs.arm.artifactType` in `.vscode/settings.json`.

| Type             | Output           | Description            |
| ---------------- | ---------------- | ---------------------- |
| `executable`     | `<project>.elf`  | Linked executable      |
| `static_library` | `lib<project>.a` | Static archive         |
| `binary`         | `<project>.bin`  | Raw binary via objcopy |
| `hex`            | `<project>.hex`  | Intel HEX via objcopy  |