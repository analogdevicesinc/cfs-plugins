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

import { PropertyProvider as BasePropertyProvider } from "cfs-plugins-sdk";
import type {
  CfsPluginProperty,
  CfsPropertyProviderService
} from "cfs-types";
import {
  CfsFeatureScope,
  CfsSocDataModel,
  SocControl,
  CfsSocControlsOverrideService
} from "cfs-types";
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

    if (scope === "project") {
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

    const { boardId, soc, secure, coreId } = (context ?? {}) as Partial<{
      boardId: string;
      soc: string;
      secure: boolean;
      coreId: string;
    }>;

    if (boardId && soc) {
      const boardNameProp = properties.find(
        (property) =>
          property.default === "" && property.id === "ZephyrBoardName"
      );

      if (boardNameProp) {
        boardNameProp.default = getZephyrBoardName(
          boardId,
          soc,
          secure,
          coreId
        );
      }

      const zephyrVersionProp = properties.find(
        (property) => property.id === "ZephyrVersion",
      );
      if (
        zephyrVersionProp &&
        (soc.toLowerCase() === "max32657" || soc.toLowerCase() === "max32658")
      ) {
        zephyrVersionProp.default = "4.4.0";
        zephyrVersionProp.enum?.push({ label: "4.4.0", value: "4.4.0" });
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
 * Get the core suffix for the Zephyr board name based on the core ID.
 * @param coreId - The core identifier (e.g., "CM4", "RV32").
 * @returns The core suffix (e.g., "/m4", "/rv32").
 */
function getCoreSuffix(coreId?: string): string {
  if (coreId?.startsWith("RV")) {
    return "/rv32";
  }
  return "/m4";
}

/**
 * Get the board name for Zephyr based on the provided board and SoC.
 * @param board
 * @param soc
 * @param secure
 * @param coreId
 * @returns The board name for Zephyr.
 */
export const getZephyrBoardName = (
  board: string,
  soc: string,
  secure?: boolean,
  coreId?: string
): string => {
  const coreSuffix = getCoreSuffix(coreId);

  switch (board.toLowerCase()) {
    case "ad-apard32690-sl":
      return `apard32690/max32690${coreSuffix}`;
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
            ? coreSuffix
            : ["max32657", "max32658"].includes(soc.toLowerCase()) &&
                secure === false
              ? "/ns"
              : ""
      }`;
    case "evsys":
      return `${soc.toLowerCase()}evsys`;
    case "fthr":
    case "fthr_reva":
      return `${soc.toLowerCase()}fthr/${soc.toLowerCase()}${soc.toLowerCase() === "max32666" ? "/cpu0" : ["max32657", "max32672", "max32650"].includes(soc.toLowerCase()) ? "" : coreSuffix}`;
    case "fthr_apps_p1":
      return `${soc.toLowerCase()}fthr_apps/${soc.toLowerCase()}${soc.toLowerCase() === "max32657" ? "" : coreSuffix}`;
    case "ad-swiot1l-sl":
      return "ad_swiot1l_sl";
    default:
      return "";
  }
};
