/**
 *
 * Copyright (c) 2024-2025 Analog Devices, Inc.
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

import { CfsWorkspace } from "../types/cfs-workspace.js";

export interface CfsWorkspaceGenerator {
  /**
   * Generate the workspace.
   * @param cfsWorkspace - The .cfsworkspace file contents used for generation.
   * @returns A promise that resolves when the workspace generation is complete.
   */
  generateWorkspace(cfsWorkspace: CfsWorkspace): Promise<void>;
}
