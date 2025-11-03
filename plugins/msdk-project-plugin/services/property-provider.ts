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

import {
  CfsFeatureScope,
  type CfsPluginProperty,
  type CfsPropertyProviderService,
  PropertyProvider as BasePropertyProvider
} from "cfs-plugins-api";

export class PropertyProvider
  extends BasePropertyProvider
  implements CfsPropertyProviderService
{
  getProperties(
    scope: CfsFeatureScope,
    context?: Record<string, unknown>
  ): CfsPluginProperty[] {
    const properties = super.getProperties(scope, context);

    const { boardId, soc } = (context ?? {}) as Partial<{
      boardId: string;
      soc: string;
    }>;

    if (boardId && soc) {
      const boardNameProp = properties.find(
        (property) =>
          property.default === "" && property.id === "MsdkBoardName"
      );

      if (boardNameProp) {
        boardNameProp.default = getMsdkBoardName(boardId, soc);
      }
    }

    return properties;
  }
}

/**
 * Get the board name for the MSDK based on the provided board and SoC.
 * @param board
 * @param soc
 * @returns The board name for the MSDK.
 */
export const getMsdkBoardName = (
  board: string,
  soc: string
): string => {
  switch (board.toLowerCase()) {
    case "evkit_v1":
      return "EvKit_V1";

    case "fthr":
      if (soc === "MAX32690") {
        return "FTHR";
      }

      if (soc === "MAX78000") {
        return "FTHR_RevA";
      }

      if (soc === "MAX32650") {
        return "FTHR_APPS_A";
      }

      return "FTHR_Apps_P1";
    case "ad-apard32690-sl":
    case "apard":
      return "APARD";
    case "ad-swiot1l-sl":
      return "AD-SWIOT1L-SL";
    case "evsys":
      return "EVSYS";
    default:
      return "";
  }
};
