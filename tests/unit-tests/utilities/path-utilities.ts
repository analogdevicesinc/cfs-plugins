/**
 *
 * Copyright (c) 2025 Analog Devices, Inc.
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

/**
 * Join path segments using the platform-specific separator, handling any extra or missing slashes
 */
export function joinPath(...paths: string[]): string {
  const separator = process.platform === 'win32' ? '\\' : '/';

  return paths
    .filter(Boolean)
    // First replace any separators in the strings with the platform-specific one
    .map((segment) => segment.replace(/[/\\]+/g, separator))
    // Then remove leading/trailing separators
    .map((segment) => segment.replace(/^[/\\]+|[/\\]+$/g, ''))
    .filter(Boolean)
    .join(separator);
}

