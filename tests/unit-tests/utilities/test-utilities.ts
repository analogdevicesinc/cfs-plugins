/**
 *
 * Copyright (c) 2025-2026 Analog Devices, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

import { readFileSync, promises as fs } from "node:fs";
import path from "node:path";
import { expect } from "chai";
import { evalNestedTemplateLiterals } from "cfs-plugins-sdk";
import type { CfsPluginInfo, CfsWorkspace } from "cfs-types";
import { validateJsonFile } from "./validate-json.js";

// Helper function to load plugin info from a file
export const loadPluginInfo = async (
  filePath: string,
): Promise<CfsPluginInfo> => {
  const absolutePath = path.resolve(filePath);
  const fileContent = await fs.readFile(absolutePath, "utf-8");
  const pluginInfo = JSON.parse(fileContent) as CfsPluginInfo;
  pluginInfo.pluginPath = absolutePath;
  return pluginInfo;
};

/**
 * Synchronous twin of {@link loadPluginInfo}. Loads a plugin manifest at test
 * collection time so suites can register one `it()` per SoC/board (or per
 * shipped patch) up front. Sets `pluginPath` like the async loader, so the
 * plugin can resolve `config-patches/` and templates at runtime.
 * @param filePath Path to the `.cfsplugin` manifest (usually under `plugins/dist/`)
 * @returns The parsed plugin info with `pluginPath` populated
 */
export function loadPluginInfoSync(filePath: string): CfsPluginInfo {
  const absolutePath = path.resolve(filePath);
  const fileContent = readFileSync(absolutePath, "utf-8");
  const pluginInfo = JSON.parse(fileContent) as CfsPluginInfo;
  pluginInfo.pluginPath = absolutePath;
  return pluginInfo;
}

// Helper function to check if a directory exists
export const directoryExists = async (dirPath: string): Promise<boolean> => {
  return fs
    .access(dirPath)
    .then(() => true)
    .catch(() => false);
};

// Helper function to check if a file exists
export const fileExists = async (filePath: string): Promise<boolean> => {
  return fs
    .access(filePath)
    .then(() => true)
    .catch(() => false);
};

/**
 * Check if the tests are run in debug mode
 * @returns True if the CFS_TEST_DEBUG environment variable is set to 1, false otherwise
 */
export function isDebug(): boolean {
  return process.env.CFS_TEST_DEBUG === "1";
}

/**
 * Delete workspace files from disk
 * @param cfsWorkspace Workspace to delete
 */
export async function deleteCreatedWorkspace(cfsWorkspace: CfsWorkspace) {
  if (!cfsWorkspace.location || !cfsWorkspace.workspaceName) {
    return;
  }

  const workspacePath = path.join(
    cfsWorkspace.location,
    cfsWorkspace.workspaceName,
  );

  await fs.rm(workspacePath, {
    recursive: true,
    force: true,
    maxRetries: 8,
    retryDelay: 150,
  });
}

/**
 * Helper function to get boards supported by each SoC of that plugin
 * @param plugin
 * @returns dictionary like structure. Each key has a list of boards that are supported
 */
export function getSocsBoardsDict(
  plugin: CfsPluginInfo,
): Record<string, string[]> {
  return plugin.supportedSocs.reduce<Record<string, string[]>>((acc, soc) => {
    if (!soc.board) {
      return acc;
    }

    if (!acc[soc.name]) {
      acc[soc.name] = [];
    }

    if (!acc[soc.name].includes(soc.board)) {
      acc[soc.name].push(soc.board);
    }

    return acc;
  }, {});
}

/**
 * Normalizes a value so it is safe to use inside a workspace name. Workspace
 * names may only contain letters, numbers, underscores, periods and hyphens -
 * the same rule the CLI and the IDE workspace wizard enforce - so any run of
 * other characters (notably the spaces in board names such as "FPGA 2.0.x") is
 * collapsed to a single hyphen.
 * @param value The value to normalize, typically a board name
 * @returns The lower-cased value with unsupported characters replaced
 */
export function sanitizeWorkspaceSegment(value: string): string {
  return value.toLowerCase().replace(/[^\w.-]+/g, "-");
}

/**
 * Drops a leading semver range operator so `dataModelVersion` reaches the
 * templates as a bare version, the way the product supplies it.
 *
 * `supportedSocs[].dataModelVersion` is a range (`^1.3.628`), but the product
 * resolves it and hands `generateWorkspace` the concrete installed version;
 * `.cfsconfig.eta` then writes `"^<%= it.dataModelVersion %>"`. Passing the
 * range straight through produces `"^^1.3.628"`, which no longer parses, and
 * every consumer silently falls back to "no data model" - `cfsutil ai build`
 * is simply the first step that needs one and so the first to fail on it.
 * Any test that builds a `CfsWorkspace` by hand must apply this.
 *
 * @param version The `dataModelVersion` from a `supportedSocs` entry
 * @returns The same version with a leading `^` or `~` removed
 */
export function stripVersionRange(version: string): string {
  return version.replace(/^[\^~]/, "");
}

/**
 * Replaces {{var}} with value from context
 * @param template
 * @param context
 * @returns original string with variables replaced
 */
export function replaceTemplateVariables(
  template: string,
  context: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return key in context ? context[key] : match;
  });
}

/**
 * The core folder a Zephyr single-core plugin makes for a given SoC. Most SoCs
 * use "m4"; the MAX32657/MAX32658 use "m33" and the dual-core MAX32666 uses
 * "m4-0". Shared by the Zephyr single-core tests so they all agree on the name.
 */
export function zephyrCoreDir(soc: string): string {
  const lower = soc.toLowerCase();
  if (["max32657", "max32658"].includes(lower)) {
    return "m33";
  }
  if (lower === "max32666") {
    return "m4-0";
  }
  return "m4";
}

/**
 * The files a Zephyr project's code generation should make. Both are named after
 * the board, so they are worked out from the project's ZephyrBoardName rather
 * than hard-coded per plugin.
 */
export function zephyrBoardCodeGenFiles(project: {
  PlatformConfig: { ZephyrBoardName: string };
}): string[] {
  const stem = project.PlatformConfig.ZephyrBoardName.split("/").join("_");
  return [`boards/${stem}.conf`, `boards/${stem}.overlay`];
}

/**
 * Derives the expected flash board config value for a SharcFX SoC+board pair.
 */
export function getExpectedSharcFxBoardCfg(soc: string, board: string): string {
  let inflected: string;
  switch (soc) {
    case "ADSP-21834":
    case "ADSP-21834W":
    case "ADSP-21835":
    case "ADSP-21835W":
    case "ADSP-21836":
    case "ADSP-21836W":
    case "ADSP-21837":
    case "ADSP-21837W":
      inflected = "adsp21835w";
      break;
    case "ADSP-SC834":
    case "ADSP-SC834W":
    case "ADSP-SC835":
    case "ADSP-SC835W":
      inflected = "adspsc835w";
      break;
    default:
      inflected = soc.toLowerCase();
  }
  const openocdBoard = inflected.replace("sc", "21");

  return `${openocdBoard}_ev_som.cfg`;
}

/**
 * Simulates GNU Make's variable-assignment precedence for a single variable
 * across an ordered list of file contents, without requiring a real `make`
 * binary (this keeps tests portable across the ubuntu/windows/macos CI
 * runners).
 *
 * Supported assignment operators, evaluated in the order they appear across
 * `orderedContents` (earlier files are processed first, matching the order
 * they would be `include`d in a real Makefile):
 * - `?=` only sets the variable if it has not been set yet.
 * - `:=` and `=` always overwrite the current value.
 * - `+=` appends to the current value (or sets it, if unset).
 *
 * @param orderedContents File contents in the order they would be included.
 * @param variableName The Make variable name to resolve.
 * @returns The resolved value, or undefined if the variable is never assigned.
 */
export function resolveMakeVariable(
  orderedContents: string[],
  variableName: string,
): string | undefined {
  const escapedVariableName = variableName.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );
  const assignmentPattern = new RegExp(
    `^[ \\t]*${escapedVariableName}[ \\t]*(\\?=|:=|\\+=|=)[ \\t]*(.*)$`,
    "gm",
  );

  let value: string | undefined;
  let isSet = false;

  for (const content of orderedContents) {
    assignmentPattern.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = assignmentPattern.exec(content)) !== null) {
      const [, operator, assignedValue] = match;

      if (operator === "?=") {
        if (!isSet) {
          value = assignedValue.trim();
          isSet = true;
        }
      } else if (operator === "+=") {
        value = isSet
          ? `${value} ${assignedValue.trim()}`
          : assignedValue.trim();
        isSet = true;
      } else {
        // ":=" or "="
        value = assignedValue.trim();
        isSet = true;
      }
    }
  }

  return value;
}

/**
 * Builds a minimal, realistic AIModels array entry for a TFLM (TensorFlow
 * Lite Micro) backend, targeting a specific core. Useful for tests that need
 * to guarantee a project's cfsconfig has an AIModels entry before running
 * code generation, independent of whatever a given plugin's own cfsconfig
 * template happens to ship by default.
 * @param core The Target.Core value the model should be associated with (e.g. "FX", "M33", "CM33").
 * @param overrides Optional overrides for the model name/symbol and the model file path.
 */
export function buildTflmAiModels(
  core: string,
  overrides: { name?: string; modelPath?: string } = {},
): Record<string, unknown>[] {
  const name = overrides.name ?? "hello_world_model_f32";
  const modelPath = overrides.modelPath ?? "hello_world_f32.tflite";

  return [
    {
      Name: name,
      Files: { Model: modelPath },
      Target: { Core: core },
      Backend: {
        Name: "tflm",
        Extensions: { Symbol: name, Section: ".data" },
      },
      Enabled: true,
    },
  ];
}

// Generated artifacts that hold strict JSON but are not named `.json`.
// Parsing is a well-formedness check only — it proves the file is not
// malformed or truncated, and says nothing about what it contains.
const JSON_FORMATTED_EXTENSIONS = new Set([
  ".json",
  ".cfsconfig",
  ".cfsdependencies",
  ".cfsworkspace",
]);

// `.code-workspace` is JSONC, not JSON: VS Code reads it with a parser that
// allows comments and trailing commas, and many of our templates emit trailing
// commas. Parsing it strictly would fail on files the product handles fine, so
// it gets the same well-formedness check against the grammar it is actually
// written in.
const JSONC_FORMATTED_EXTENSIONS = new Set([".code-workspace"]);

/**
 * Rewrites JSONC as strict JSON by dropping comments and trailing commas, so
 * the result can be handed to `JSON.parse`. String literals are tracked so
 * that `//` or a comma inside a value is never mistaken for syntax.
 * @param text JSONC source
 * @returns Equivalent strict JSON
 */
function jsoncToJson(text: string): string {
  const out: string[] = [];
  let index = 0;

  while (index < text.length) {
    const char = text[index];

    if (char === '"') {
      const start = index++;
      while (index < text.length && text[index] !== '"') {
        index += text[index] === "\\" ? 2 : 1;
      }
      out.push(text.slice(start, ++index));
      continue;
    }

    if (char === "/" && text[index + 1] === "/") {
      while (index < text.length && text[index] !== "\n") index++;
      continue;
    }

    if (char === "/" && text[index + 1] === "*") {
      const end = text.indexOf("*/", index + 2);
      index = end === -1 ? text.length : end + 2;
      continue;
    }

    if (char === "}" || char === "]") {
      // Drop a comma that only whitespace separates from this closer.
      let last = out.length - 1;
      while (last >= 0 && out[last].trim() === "") last--;
      if (last >= 0 && out[last] === ",") out.splice(last, 1);
    }

    out.push(char);
    index++;
  }

  return out.join("");
}

/**
 * Validates that a generated file on disk is non-empty, and—when it holds
 * JSON—that its contents parse. Covers JSON-formatted artifacts that do not
 * carry a .json extension (.cfsconfig, .cfsdependencies), plus `.code-workspace`,
 * which is checked as JSONC.
 * @param filePath Path to the file to validate
 */
export async function validateGeneratedFileContent(
  filePath: string,
): Promise<void> {
  const stats = await fs.stat(filePath);
  expect(stats.size, `Generated file is empty: ${filePath}`).to.be.greaterThan(
    0,
  );

  // `.code-workspace` is a two-part suffix that path.extname cannot see.
  const base = path.basename(filePath).toLowerCase();
  const extension = base.endsWith(".code-workspace")
    ? ".code-workspace"
    : path.extname(base);

  if (JSON_FORMATTED_EXTENSIONS.has(extension)) {
    const isValidJson = await validateJsonFile(filePath);
    expect(isValidJson, `Generated file is not valid JSON: ${filePath}`).to.be
      .true;
  }

  if (JSONC_FORMATTED_EXTENSIONS.has(extension)) {
    const contents = await fs.readFile(filePath, "utf-8");
    expect(() => {
      JSON.parse(jsoncToJson(contents));
    }, `Generated file is not valid JSONC: ${filePath}`).to.not.throw();
  }
}

/**
 * Resolves a manifest template/file `dst` to the path the SDK actually writes,
 * relative to the generation directory.
 *
 * A manifest destination may name a directory rather than a file — a bare `/`,
 * or `.vscode/`, `src/` — in which case the SDK appends the source basename.
 * The rule differs by entry kind, so this mirrors both SDK code paths:
 *   - templates (`renderTemplates`): the dst is a directory when it ends with a
 *     path separator (the SDK's `isDir`), and the `.eta` suffix is stripped
 *     from the appended basename.
 *   - files (`copyFiles`): the dst is a directory when it ends with a separator
 *     OR has no file extension; the basename is appended verbatim.
 *
 * Resolving here lets a `fileExists` assertion check the real generated file
 * (`CMakeLists.txt`, `README.rst`, `src/main.c`, ...) instead of merely its
 * parent directory, which exists regardless of whether the file was written.
 *
 * `isDir` is declared in the SDK types but is not exported from the package
 * runtime, so the trailing-separator test is inlined here.
 * @param entry Manifest template/file entry (`src`/`dst` from the `.cfsplugin`)
 * @param kind Whether `entry` is a rendered template or a copied file
 * @param context Codegen context used to evaluate `${...}` expressions in `dst`
 * @returns The output path relative to the generation directory
 */
export function resolveManifestDst(
  entry: { src: string; dst: string },
  kind: "template" | "file",
  context: Record<string, unknown>,
): string {
  const isTemplate = kind === "template";
  const evaluatedDst = evalNestedTemplateLiterals(entry.dst, context);
  const endsWithSeparator = /[/\\]$/.test(evaluatedDst);
  const isDirectoryDst = isTemplate
    ? endsWithSeparator
    : endsWithSeparator || path.extname(evaluatedDst) === "";

  if (!isDirectoryDst) {
    return evaluatedDst;
  }

  const baseName = isTemplate
    ? path.basename(entry.src).replace(/\.eta$/, "")
    : path.basename(entry.src);

  return path.posix.join(
    evaluatedDst.replace(/\\/g, "/").replace(/\/+$/, ""),
    baseName,
  );
}
