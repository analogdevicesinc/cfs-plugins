## Description

A basic getting started program for Core 2 (ARM M33) on ADSP-SC83x processors. This will print "ARM: Hello world!" and exit.

## Build Artifact Types

The default artifact type is `executable`. Override it via `make ARTIFACT_TYPE=<type>` or change `cfs.arm.artifactType` in `.vscode/settings.json`.

| Type             | Output            | Description            |
| ---------------- | ----------------- | ---------------------- |
| `executable`     | `<project>.elf`     | Linked executable      |
| `static_library` | `lib<project>.a`  | Static archive         |
| `binary`         | `<project>.bin`   | Raw binary via objcopy |
| `hex`            | `<project>.hex`   | Intel HEX via objcopy  |
