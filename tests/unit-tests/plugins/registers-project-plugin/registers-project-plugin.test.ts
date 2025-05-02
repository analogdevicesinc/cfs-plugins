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
import {
  CfsFeatureScope,
  CfsPluginInfo,
  CfsProject,
  CfsWorkspace,
  CfsConfig,
  CfsCodeGenerationContext,
} from "cfs-plugins-api";
import WorkspacePlugin from "../../../../plugins/default-workspace-plugin/index.js";
import RegistersProjectPlugin from "../../../../plugins/registers-project-plugin/index.js";
import {
  directoryExists,
  fileExists,
  isDebug,
} from "../../utilities/test-utilities.js";
import { expect } from "chai";
import {
  CfsEtaProjectGenerator,
  CfsEtaWorkspaceGenerator,
  CfsEtaCodeGenerator,
} from "../../../../plugins/common/generators/index.js";

describe("Unit tests for the Registers Project Plugin", () => {
  let projectPlugin: RegistersProjectPlugin;
  let workspacePlugin: WorkspacePlugin;
  let workspacePluginInfo: CfsPluginInfo;
  let projectPluginInfo: CfsPluginInfo;

  // Define workspace and project configurations
  const cfsWorkspace = {
    workspacePluginId: "test-plugin-id",
    workspacePluginVersion: "1.0.0",
    workspaceName: "test-workspace",
    location: "tests/unit-tests/plugins/registers-project-plugin/data",
    copyrightDate: new Date().getFullYear().toString(),
    dataModelVersion: "1.0.0",
    dataModelSchemaVersion: "1.0.0",
    package: "test-package",
    timestamp: new Date().toISOString(),
    board: "test-board",
    soc: "test-soc",
    projects: [
      {
        name: "riscv",
        path: "./riscv",
        platformConfig: { ProjectName: "riscv" },
      },
    ],
  } as CfsWorkspace;

  const cfsProject = {
    id: "test-project-id",
    package: "test-package",
    board: "test-board",
    soc: "test-soc",
    name: "test-project",
    copyrightDate: new Date().getFullYear().toString(),
    path: "tests/unit-tests/plugins/registers-project-plugin/data/test-workspace",
    pluginId: "test-plugin-id",
    pluginVersion: "1.0.0",
    pluginConfig: {},
    coreArchitecture: "riscv",
    platformConfig: { ProjectName: "riscv" },
  } as CfsProject;

  const cfsConfig: CfsConfig = {
    Copyright:
      "Copyright (c) 2024 Analog Devices, Inc.  All rights reserved. This software is proprietary to Analog Devices, Inc. and its licensors.",
    DataModelVersion: "0.0.25",
    DataModelSchemaVersion: "1.0.0",
    Soc: "MAX32690",
    Package: "TQFN",
    Pins: [],
    ClockNodes: [],
    BoardName: "EvKit_V1",
    Timestamp: new Date().toISOString(),
    Projects: [
      {
        CoreId: "RV",
        ProjectId: "RV",
        PluginId: "string",
        PluginVersion: "string",
        FirmwarePlatform: "msdk",
        ExternallyManaged: true,
        Partitions: [{ Name: "Name" } as any],
        PlatformConfig: { ProjectName: "riscv" },
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
      const projectPluginPath = "plugins/registers-project-plugin/.cfsplugin";
      const absoluteProjectPath = path.resolve(projectPluginPath);
      console.log(`absolute project path: ${absoluteProjectPath}`);
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
    projectPlugin = new RegistersProjectPlugin(projectPluginInfo, cfsProject);
  });

  afterEach(async () => {
    if (!isDebug()) {
      await fs.promises.rm(cfsWorkspace.location as string, {
        recursive: true,
        force: true,
      });
    }
  });

  it("Should generate a RISC-V registers-only project", async () => {
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

  it("Should generate code for RISC-V registers-only project", async () => {
    const socPath = path.resolve(
      `tests/unit-tests/soc/${cfsConfig.Soc.toLowerCase()}-${cfsConfig.Package.toLowerCase()}.json`,
    );

    expect(fs.existsSync(socPath), `Soc path does not exist: ${socPath}`).to.be
      .true;

    const socFileContent = await fsp.readFile(socPath, "utf-8");
    const socData = JSON.parse(socFileContent);
    const codeGenerationPath = cfsProject.path;

    projectPlugin = new RegistersProjectPlugin(projectPluginInfo, cfsConfig);

    const codeGenerator = projectPlugin.getGenerator<CfsEtaCodeGenerator>(
      CfsFeatureScope.CodeGen,
    );

    const codeGenData: CfsCodeGenerationContext = {
      cfsconfig: cfsConfig,
      datamodel: socData,
      projectId: "RV",
    };

    const filesGenerated = await codeGenerator.generateCode(
      codeGenData,
      codeGenerationPath,
    );

    const expectedFiles = projectPluginInfo.features.codegen.templates.map(
      (template) => template.dst,
    );

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
