/**
 *
 * Copyright (c) 2024 Analog Devices, Inc.
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

import { CfsSocDataModel } from "./types/cfs-soc-data-model.js";

export interface CfsDataProvider {
  /**
   * Retrieve the SoC data model with any changes applied, as described in the .cfsplugin file
   * @param soc - The SoC name to retrieve the data model for
   * @param socPackage - The SoC package to retrieve the data model for
   * @returns - The SoC data model with changes applied
   */
  getSocDataModel(soc: string, socPackage: string): CfsSocDataModel;
}
