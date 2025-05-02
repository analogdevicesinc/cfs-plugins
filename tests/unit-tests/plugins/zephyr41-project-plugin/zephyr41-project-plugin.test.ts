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

import path from "node:path";
import fs, { promises as fsp } from "node:fs";
import { expect } from "chai";
import * as chai from "chai";
import {
  CfsPluginInfo,
  CfsFeatureScope,
  CfsConfig,
  CfsCodeGenerationContext,
} from "cfs-plugins-api";
import Zephyr41ProjectPlugin from "../../../../plugins/zephyr41-project-plugin/index.js";
import WorkspacePlugin from "../../../../plugins/default-workspace-plugin/index.js";
import { CfsEtaWorkspaceGenerator } from "../../../../plugins/common/generators/eta/cfs-eta-workspace-generator.js";
import { CfsEtaProjectGenerator } from "../../../../plugins/common/generators/eta/cfs-eta-project-generator.js";
import { directoryExists, fileExists } from "../../utilities/test-utilities.js";
import { isDebug } from "../../utilities/test-utilities.js";
import { CfsEtaCodeGenerator } from "../../../../plugins/common/generators/index.js";
import chaiAsPromised from "chai-as-promised";

chai.use(chaiAsPromised);

describe("Unit test for Arm ZEPHYR4.1 Project Plugin", () => {
  let projectPlugin: Zephyr41ProjectPlugin;
  let workspacePlugin: WorkspacePlugin;
  let workspacePluginInfo: CfsPluginInfo;
  let projectPluginInfo: CfsPluginInfo;

  // Define workspace and project configurations
  const cfsWorkspace = {
    workspacePluginId: "test-plugin-id",
    workspacePluginVersion: "1.0.0",
    workspaceName: "test-workspace",
    location: "tests/unit-tests/plugins/zephyr41-project-plugin/data",
    copyrightDate: new Date().getFullYear().toString(),
    dataModelVersion: "1.0.0",
    dataModelSchemaVersion: "1.0.0",
    package: "WLP",
    timestamp: new Date().toISOString(),
    board: "AD-APARD32690-SL",
    soc: "MAX32690",
    projects: [
      { name: "m4", path: "./m4", platformConfig: { ProjectName: "m4" } },
    ],
  };

  const cfsProject = {
    id: "CM4",
    package: "WLP",
    board: "AD-APARD32690-SL",
    soc: "MAX32690",
    name: "test-project",
    path: "tests/unit-tests/plugins/zephyr41-project-plugin/data/test-workspace",
    pluginId: "test-plugin-id",
    pluginVersion: "1.0.0",
    platformConfig: {
      ProjectName: "m4",
      ZephyrBoardName: "apard32690/max32690/m4",
      CMakeArgs: "",
    },
  };

  const cfsConfig: CfsConfig = {
    Copyright:
      "Copyright (c) 2024 Analog Devices, Inc.  All rights reserved. This software is proprietary to Analog Devices, Inc. and its licensors.",
    DataModelVersion: "0.0.25",
    DataModelSchemaVersion: "1.0.0",
    Soc: "MAX32690",
    Package: "WLP",
    Pins: [],
    ClockNodes: [],
    Timestamp: new Date().toISOString(),
    BoardName: "AD-APARD32690-SL",
    Projects: [
      {
        CoreId: "CM4",
        ProjectId: "CM4",
        PluginId: "string",
        PluginVersion: "string",
        FirmwarePlatform: "zephyr-4.1",
        ExternallyManaged: true,
        Partitions: [{ Name: "Name" } as any],
        PlatformConfig: {
          ProjectName: "m4",
          ZephyrBoardName: "apard32690/max32690/m4",
          KConfigFlags: "",
          CMakeArgs: "",
        },
        Peripherals: [{ Name: "Name" } as any],
      },
    ],
  };

  before(async () => {
    try {
      const workspacePluginPath = "plugins/default-workspace-plugin/.cfsplugin";
      const absoluteWorkspacePath = path.resolve(workspacePluginPath);
      const workspaceFileContent = await fs.promises.readFile(
        absoluteWorkspacePath,
        "utf-8",
      );
      workspacePluginInfo = JSON.parse(workspaceFileContent) as CfsPluginInfo;
      workspacePluginInfo.pluginPath = absoluteWorkspacePath;
      const projectPluginPath = "plugins/zephyr41-project-plugin/.cfsplugin";
      const absoluteProjectPath = path.resolve(projectPluginPath);
      const projectFileContent = await fs.promises.readFile(
        absoluteProjectPath,
        "utf-8",
      );
      projectPluginInfo = JSON.parse(projectFileContent) as CfsPluginInfo;
      projectPluginInfo.pluginPath = absoluteProjectPath;
    } catch (error) {
      expect.fail(`${error}`);
    }
  });

  beforeEach(() => {
    workspacePlugin = new WorkspacePlugin(workspacePluginInfo, cfsWorkspace);
    projectPlugin = new Zephyr41ProjectPlugin(projectPluginInfo, cfsProject);
  });

  afterEach(async () => {
    if (!isDebug()) {
      await fs.promises.rm(cfsWorkspace.location, {
        recursive: true,
        force: true,
      });
    }
  });

  it("Should generate an Arm Zephyr 4.1 project", async () => {
    const workspaceGenerator =
      workspacePlugin.getGenerator<CfsEtaWorkspaceGenerator>(
        CfsFeatureScope.Workspace,
      );

    const projectGenerator = projectPlugin.getGenerator<CfsEtaProjectGenerator>(
      CfsFeatureScope.Project,
    );

    // Generate workspace and project
    const projectPath =
      cfsProject.path +
      "/" +
      (cfsProject.platformConfig as { ProjectName: string }).ProjectName;
    await workspaceGenerator.generateWorkspace(cfsWorkspace);
    await projectGenerator.generateProject(projectPath);

    // Check if directory exists
    const projectExists = await directoryExists(projectPath);
    expect(projectExists, "Project directory should exist after generation").to
      .be.true;

    const expectedFiles = [
      ...projectPluginInfo.features.project.templates.map(
        (template) => template.dst,
      ),
      ...projectPluginInfo.features.project.files.map((file) => file.dst),
    ];

    for (const file of expectedFiles) {
      const filePath = path.join(projectPath, file);
      const fileExistsInProject = await fileExists(filePath);

      expect(
        fileExistsInProject,
        `File ${file} should exist in the project directory`,
      ).to.be.true;
    }
  });

  it("Should generate code for Arm Zephyr 4.1", async () => {
    const socPath = path.resolve(
      `tests/unit-tests/soc/${cfsConfig.Soc.toLowerCase()}-${cfsConfig.Package.toLowerCase()}.json`,
    );

    expect(fs.existsSync(socPath), `Soc path does not exist: ${socPath}`).to.be
      .true;

    const socFileContent = await fsp.readFile(socPath, "utf-8");
    const socData = JSON.parse(socFileContent);
    const codeGenerationPath = cfsProject.path;

    projectPlugin = new Zephyr41ProjectPlugin(projectPluginInfo, cfsConfig);

    const codeGenerator = projectPlugin.getGenerator<CfsEtaCodeGenerator>(
      CfsFeatureScope.CodeGen,
    );

    const codeGenData: CfsCodeGenerationContext = {
      cfsconfig: cfsConfig,
      datamodel: socData,
      projectId: "CM4",
      coreId: "CM4",
    };

    const filesGenerated = await codeGenerator.generateCode(
      codeGenData,
      codeGenerationPath,
    );

    // Verify the generated project files
    const expectedFiles = [
      "boards/apard32690_max32690_m4.conf",
      "boards/apard32690_max32690_m4.overlay",
    ];

    const projectName =
      cfsConfig.Projects.find(
        (project) => project.ProjectId === codeGenData.projectId,
      )?.PlatformConfig.ProjectName ?? "";
    for (const file of expectedFiles) {
      const filePath = path.join(codeGenerationPath, projectName, file);
      const fileExistsInProject = await fileExists(filePath);
      expect(
        fileExistsInProject,
        `File ${file} should exist in the project directory`,
      ).to.be.true;
    }

    expect(
      expectedFiles.every((expectedFile) => {
        return filesGenerated.includes(
          `${codeGenerationPath}/${projectName}/${expectedFile}`,
        );
      }),
      `Expected files: ${expectedFiles.join(
        ", ",
      )} are not found in generated files: ${filesGenerated.join(", ")}`,
    ).to.be.true;
  });
});
