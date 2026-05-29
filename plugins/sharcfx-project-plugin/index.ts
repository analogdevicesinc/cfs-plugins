/**
 *
 * Copyright (c) 2026 Analog Devices, Inc.
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

import { GenericPlugin } from "cfs-plugins-sdk";

class SharcFxProjectPlugin extends GenericPlugin {
  override getMemoryAccessOverrides(
    partName: string,
    coreId: string
  ): Record<string, string[] | undefined> | undefined {
    /** NOTE Currently we disable memory access selection for all parts.
     * If needed we can add specific overrides for SharcFX parts
     * by checking the partName and returning appropriate overrides.
     */

    if (coreId === "FX") {
      return {
        RAM: [],
        Flash: []
      };
    }

    // default behavior
    return super.getMemoryAccessOverrides(partName, coreId);
  }
}

export default SharcFxProjectPlugin;
