## Description

A basic getting started program for Core 1 (SHARC-FX) on ADSP2183x and ADSP-SC83x processors. This will print "Hello world!" and exit.

## Build Artifact Types

The default artifact type is `executable`. Override it via `make ARTIFACT_TYPE=<type>` or change `cfs.sfx.artifactType` in `.vscode/settings.json`.

| Type             | Output           | Description       |
| ---------------- | ---------------- | ----------------- |
| `executable`     | `<project>.dxe`  | Linked executable |
| `static_library` | `lib<project>.a` | Static archive    |
