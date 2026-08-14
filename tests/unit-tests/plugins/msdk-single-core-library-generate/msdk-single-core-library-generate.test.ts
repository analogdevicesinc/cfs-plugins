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

import { promises as fs } from "node:fs";
import path from "node:path";
import { expect } from "chai";
import { GenericPlugin } from "cfs-plugins-sdk";
import type { CfsPluginInfo, CfsWorkspace } from "cfs-types";
import { WorkspaceValidationService } from "@services/WorkspaceValidationService.js";
import {
  deleteCreatedWorkspace,
  getSocsBoardsDict,
  isDebug,
  replaceTemplateVariables,
} from "@utilities/test-utilities.js";

const filePath = "plugins/dist/msdk-single-core-library-generate/.cfsplugin";
const absolutePath = path.resolve(filePath);
const fileContent = await fs.readFile(absolutePath, "utf-8");
let pluginInfo = JSON.parse(fileContent) as CfsPluginInfo;
pluginInfo.pluginPath = absolutePath;

const supportedSocs = getSocsBoardsDict(pluginInfo);

describe("MSDK Single Core Library Generate Tests", () => {
  it("should have at least one supported SoC/board combination", () => {
    expect(Object.keys(supportedSocs).length).to.be.greaterThan(0);
  });

  let genericPlugin: GenericPlugin;
  let cfsWorkspace: CfsWorkspace | undefined;

  beforeEach(() => {
    genericPlugin = new GenericPlugin(pluginInfo);
    cfsWorkspace = undefined;
  });

  afterEach(async () => {
    if (!isDebug() && cfsWorkspace) {
      await deleteCreatedWorkspace(cfsWorkspace);
    }
  });

  describe("GenerateWorkspace_BasicFlow_ShouldGenerateExpectedFiles", () => {
    const expectedWorkspaceFilesBase = [
      "m4/src/gpiolib.c",
      "m4/README.md",
      ".cfs/.cfsdependencies",
      ".cfs/.cfsworkspace",
      "m4/.vscode/settings.json",
      "m4/src/gpiolib.h",
      "m4/project.mk",
      "m4/Makefile",
      "m4/.vscode/c_cpp_properties.json",
      "m4/m4.jdebug",
      "m4/.vscode/cfs.tasks.json",
      "{{soc}}-{{board}}-workspace-gen.code-workspace",
    ];

    const workspaceValidationService = new WorkspaceValidationService();
    Object.entries(supportedSocs).forEach(([soc, boards]) => {
      boards.forEach((board) => {
        it(`For ${soc} soc with ${board} board`, async () => {
          const socInfo = pluginInfo.supportedSocs.find(
            (s) => s.name === soc && s.board === board,
          );

          if (!socInfo) {
            expect.fail(
              `No supportedSocs entry found for soc="${soc}" board="${board}"`,
            );
          }

          const expectedWorkspaceFiles = expectedWorkspaceFilesBase.map(
            (file) =>
              replaceTemplateVariables(file, {
                soc: soc.toLowerCase(),
                board: board.toLowerCase(),
                package: socInfo.package.toLowerCase(),
              }),
          );

          cfsWorkspace = {
            location:
              "tests/unit-tests/plugins/msdk-single-core-library-generate/data",
            workspacePluginId: pluginInfo?.pluginId,
            workspacePluginVersion: pluginInfo?.pluginVersion,
            workspaceName: `${soc.toLowerCase()}-${board.toLowerCase()}-workspace-gen`,
            copyrightDate: new Date().getFullYear().toString(),
            dataModelVersion: socInfo.dataModelVersion,
            package: socInfo.package.toLowerCase(),
            timestamp: new Date().toISOString(),
            board: board,
            soc: soc,
            projects: [
              {
                name: "m4",
                path: "./m4",
              },
            ],
          };

          await genericPlugin.generateWorkspace(cfsWorkspace);

          await workspaceValidationService.validateWorkspaceFiles(
            cfsWorkspace,
            expectedWorkspaceFiles,
          );

          await workspaceValidationService.validateDirectoryStructure(
            cfsWorkspace,
            "m4",
          );
        });
      });
    });
  });
});
