# SHARC-FX example

This is a very simple example using TFLM on SHARC-FX. It will use a model to predict sin values then compare them with the correct value.

The TFLM library will be built from source, if it is not present in the workspace. Note that executing the `clean` action will not clean the library build. If you need to clean and rebuild the library, use the `clean Tensorflow Lite library` action.

## Build Artifact Types

The default artifact type is `executable`. Override it via `make ARTIFACT_TYPE=<type>` or change `cfs.sfx.artifactType` in `.vscode/settings.json`.

| Type             | Output           | Description       |
| ---------------- | ---------------- | ----------------- |
| `executable`     | `<project>.dxe`  | Linked executable |
| `static_library` | `lib<project>.a` | Static archive    |
