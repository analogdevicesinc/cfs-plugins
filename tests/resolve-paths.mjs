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

import { readFileSync } from "node:fs";
import { resolve as pathResolve, dirname, join } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const tsconfigPath = pathResolve(dirname(fileURLToPath(import.meta.url)), "tsconfig.json");
const tsconfig = JSON.parse(readFileSync(tsconfigPath, "utf-8"));
const basePath = dirname(tsconfigPath);

const aliases = {};
for (const [pattern, targets] of Object.entries(tsconfig.compilerOptions?.paths ?? {})) {
  const prefix = pattern.replace("/*", "/");
  const target = targets[0].replace("/*", "/");
  aliases[prefix] = pathResolve(basePath, target);
}

export function resolve(specifier, context, nextResolve) {
  for (const [prefix, targetDir] of Object.entries(aliases)) {
    if (specifier.startsWith(prefix)) {
      const rest = specifier.slice(prefix.length).replace(/\.js$/, ".ts");
      const resolved = pathToFileURL(join(targetDir, rest)).href;
      return { url: resolved, shortCircuit: true };
    }
  }
  return nextResolve(specifier, context);
}
