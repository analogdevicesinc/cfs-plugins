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

import { expect } from "chai";
import type {
  CfsFeatureScope,
  CfsPluginInfo,
  CfsPluginProperty,
} from "cfs-types";
import MsdkProjectPlugin from "@plugins/msdk-project-plugin/index.js";
import { getMsdkBoardName } from "@plugins/msdk-project-plugin/services/property-provider.js";
import { loadPluginInfoSync } from "@utilities/test-utilities.js";

const PROJECT_MANIFEST = "plugins/dist/msdk-project-plugin/.cfsplugin";
const deepClone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

function projectProperties(info: CfsPluginInfo): CfsPluginProperty[] {
  return info.properties?.project ?? [];
}

describe("MSDK project plugin - getProperties", () => {
  const projectPluginInfo: CfsPluginInfo = loadPluginInfoSync(PROJECT_MANIFEST);
  let projectPlugin: MsdkProjectPlugin;

  beforeEach(() => {
    const clonedInfo = JSON.parse(
      JSON.stringify(projectPluginInfo),
    ) as CfsPluginInfo;
    clonedInfo.pluginPath = projectPluginInfo.pluginPath;
    projectPlugin = new MsdkProjectPlugin(clonedInfo);
  });

  it("returns an array of properties for the project scope", () => {
    const properties = projectPlugin.getProperties("project");
    expect(properties).to.be.an("array");
  });

  it("returns an empty array for an unknown scope", () => {
    const properties = projectPlugin.getProperties(
      "fakeScope" as CfsFeatureScope,
    );
    expect(properties).to.be.an("array");
    expect(properties.length).to.equal(0);
  });

  it("includes ProjectName and Cflags properties for project scope", () => {
    const result = projectPlugin.getProperties("project");

    const projectNameProp = result.find((prop) => prop.id === "ProjectName");
    const cflagsProp = result.find((prop) => prop.id === "Cflags");

    expect(projectNameProp).to.exist;
    expect(projectNameProp?.required).to.be.true;
    expect(cflagsProp).to.exist;
  });

  it("populates MsdkBoardName when context has boardId and soc", () => {
    const result = projectPlugin.getProperties("project", {
      boardId: "evkit_v1",
      soc: "MAX32690",
    });

    const boardNameProp = result.find((prop) => prop.id === "MsdkBoardName");

    expect(boardNameProp).to.exist;
    expect(boardNameProp?.default).to.eq("EvKit_V1");
  });

  it("returns empty MsdkBoardName when no context is passed", () => {
    const result = projectPlugin.getProperties("project");

    const boardNameProp = result.find((prop) => prop.id === "MsdkBoardName");

    expect(boardNameProp).to.exist;
    expect(boardNameProp?.default).to.eq("");
  });

  it("returns empty MsdkBoardName when context has no boardId/soc", () => {
    const result = projectPlugin.getProperties("project", {
      someKey: "some-value",
    });

    const boardNameProp = result.find((prop) => prop.id === "MsdkBoardName");

    expect(boardNameProp).to.exist;
    expect(boardNameProp?.default).to.eq("");
  });

  describe("getMsdkBoardName", () => {
    const cases: [string, string, string][] = [
      ["evkit_v1", "MAX32690", "EvKit_V1"],
      ["EVSYS", "MAX32660", "EvKit_V1"],
      ["evsys", "MAX32660", "EvKit_V1"],
      ["FTHR", "MAX32650", "FTHR_APPS_A"],
      ["FTHR", "MAX32655", "FTHR_Apps_P1"],
      ["FTHR", "MAX32675C", "FTHR_Apps_B"],
      ["FTHR", "MAX78000", "FTHR_RevA"],
      ["FTHR", "MAX32666", "FTHR"],
      ["ad-apard32690-sl", "MAX32690", "APARD"],
      ["apard", "MAX32690", "APARD"],
      ["ad-swiot1l-sl", "MAX32690", "AD-SWIOT1L-SL"],
      ["unknown-board", "MAX32690", ""],
    ];

    cases.forEach(([board, soc, expected]) => {
      it(`should return "${expected}" for board="${board}" soc="${soc}"`, () => {
        expect(getMsdkBoardName(board, soc)).to.eq(expected);
      });
    });
  });

  describe("covers every supported SoC (manifest drift guard)", () => {
    it("returns project properties with a populated MsdkBoardName for every supported SoC/board", () => {
      const unconditionalIds = projectProperties(projectPluginInfo)
        .filter((prop) => !prop.condition)
        .map((prop) => prop.id);

      for (const supportedSoc of projectPluginInfo.supportedSocs) {
        const freshInfo = deepClone(projectPluginInfo);
        freshInfo.pluginPath = projectPluginInfo.pluginPath;
        const freshPlugin = new MsdkProjectPlugin(freshInfo);

        const context: Record<string, string> = { soc: supportedSoc.name };
        if (supportedSoc.board) {
          context.boardId = supportedSoc.board;
        }

        const result = freshPlugin.getProperties("project", context);
        const ids = result.map((prop) => prop.id);

        for (const id of unconditionalIds) {
          expect(
            ids,
            `${id} should be present for ${supportedSoc.name}`,
          ).to.include(id);
        }

        if (supportedSoc.board) {
          const boardNameProp = result.find(
            (prop) => prop.id === "MsdkBoardName",
          );
          expect(
            boardNameProp?.default,
            `MsdkBoardName should be populated for ${supportedSoc.name} with board ${supportedSoc.board}`,
          ).to.not.eq("");
        }
      }
    });
  });
});
