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
  CfsSocDataModel,
  SocControl,
  CfsSocControlsOverrideService,
  PropertyProvider as BasePropertyProvider
} from "cfs-plugins-api";
import os from "os";

export class PropertyProvider
  extends BasePropertyProvider
  implements
    CfsPropertyProviderService,
    CfsSocControlsOverrideService
{
  getProperties(
    scope: CfsFeatureScope,
    context?: Record<string, unknown>
  ): CfsPluginProperty[] {
    const properties = super.getProperties(scope, context);

    if (scope === CfsFeatureScope.Project) {
      const buildSystemProp = properties.find(
        (prop) => prop.id === "BuildSystem"
      );

      if (buildSystemProp?.enum) {
        if (os.platform() === "win32") {
          const makeIndex = buildSystemProp.enum.findIndex(
            (prop) => prop.value === "make"
          );

          if (makeIndex !== -1) {
            buildSystemProp.enum.splice(makeIndex, 1);
          }
        }
      }
    }

    const { boardId, soc } = (context ?? {}) as Partial<{
      boardId: string;
      soc: string;
    }>;

    if (boardId && soc) {
      const boardNameProp = properties.find(
        (property) =>
          property.default === "" && property.id === "ZephyrBoardName"
      );

      if (boardNameProp) {
        boardNameProp.default = getZephyrBoardName(boardId, soc);
      }
    }
    return properties;
  }

  override overrideControls(
    scope: CfsFeatureScope,
    soc: CfsSocDataModel
  ): Record<string, SocControl[]> {
    const controls = super.overrideControls(scope, soc);

    return controls;
  }
}

/**
 * Get the board name for Zephyr based on the provided board and SoC.
 * @param board
 * @param soc
 * @returns The board name for Zephyr.
 */
export const getZephyrBoardName = (
  board: string,
  soc: string
): string => {
  switch (board.toLowerCase()) {
    case "ad-apard32690-sl":
      return "apard32690/max32690/m4";
    case "evkit_v1":
      if (soc.toLowerCase() === "max32675c") {
        return "max32675evkit/max32675";
      }

      return `${soc.toLowerCase()}evkit/${soc.toLowerCase()}${
        soc.toLowerCase() === "max32666"
          ? "/cpu0"
          : ["max78000", "max78002", "max32690", "max32655"].includes(
                soc.toLowerCase()
              )
            ? "/m4"
            : ""
      }`;
    case "evsys":
      return `${soc.toLowerCase()}evsys`;
    case "fthr":
    case "fthr_reva":
      return `${soc.toLowerCase()}fthr/${soc.toLowerCase()}${soc.toLowerCase() === "max32666" ? "/cpu0" : ["max32657", "max32672", "max32650"].includes(soc.toLowerCase()) ? "" : "/m4"}`;
    case "fthr_apps_p1":
      return `${soc.toLowerCase()}fthr_apps/${soc.toLowerCase()}${soc.toLowerCase() === "max32657" ? "" : "/m4"}`;
    case "ad-swiot1l-sl":
      return "ad_swiot1l_sl";
    default:
      return "";
  }
};
