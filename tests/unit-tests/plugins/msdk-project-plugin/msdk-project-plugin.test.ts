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
import sinon from "sinon";
import fs, { promises as fsp } from "node:fs";
import {
  CfsFeatureScope,
  CfsPluginInfo,
  CfsProject,
  CfsWorkspace,
  CfsConfig,
  CfsCodeGenerationContext,
  CfsSocDataModel,
  SocControl,
  evalNestedTemplateLiterals,
  GenericPlugin,
} from "cfs-plugins-api";
import MsdkProjectPlugin from "../../../../plugins/msdk-project-plugin/index.js";
import {
  directoryExists,
  fileExists,
  isDebug,
} from "../../utilities/test-utilities.js";
import { expect } from "chai";
import { joinPath } from "../../utilities/path-utilities.js";
import {
  validateJsonFile,
  findJsonFiles,
} from "../../utilities/validate-json.js";

describe("Unit tests for MSDK Project Plugin", () => {
  let projectPlugin: MsdkProjectPlugin;
  let workspacePlugin: GenericPlugin;
  let workspacePluginInfo: CfsPluginInfo;
  let projectPluginInfo: CfsPluginInfo;

  // Define workspace and project configurations
  const cfsWorkspace = {
    workspacePluginId: "test-plugin-id",
    workspacePluginVersion: "1.0.0",
    workspaceName: "test-workspace",
    location: "tests/unit-tests/plugins/msdk-project-plugin/data",
    copyrightDate: new Date().getFullYear().toString(),
    dataModelVersion: "1.0.0",
    dataModelSchemaVersion: "1.0.0",
    package: "test-package",
    timestamp: new Date().toISOString(),
    board: "test-board",
    soc: "workspace-soc",
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
    coreId: "RV",
    board: "test-board",
    soc: "project-soc",
    name: "test-project",
    path: "tests/unit-tests/plugins/msdk-project-plugin/data/test-workspace",
    pluginId: "test-plugin-id",
    pluginVersion: "1.0.0",
    pluginConfig: {},
    platformConfig: {
      ProjectName: "riscv",
      Cflags:
        "-fdump-rtl-expand\n-fdump-rtl-dfinish\n-fdump-ipa-cgraph\n-fstack-usage\n-gdwarf-4",
    },
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
        Partitions: [
          {
            Name: "Name",
            Access: "R/W",
            StartAddress: "0x10000000",
            Size: 1024,
          } as any,
        ],
        PlatformConfig: { ProjectName: "riscv", Cflags: "" },
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
        "utf-8"
      );
      workspacePluginInfo = JSON.parse(workspaceFileContent) as CfsPluginInfo;
      workspacePluginInfo.pluginPath = absoluteWorkspacePath;
      const projectPluginPath = "plugins/msdk-project-plugin/.cfsplugin";
      const absoluteProjectPath = path.resolve(projectPluginPath);
      const projectFileContent = await fs.promises.readFile(
        absoluteProjectPath,
        "utf-8"
      );
      projectPluginInfo = JSON.parse(projectFileContent) as CfsPluginInfo;
      projectPluginInfo.pluginPath = absoluteProjectPath;
    } catch (error) {
      expect.fail(`${error}`);
    }
  });

  beforeEach(() => {
    workspacePlugin = new GenericPlugin(workspacePluginInfo);
    projectPlugin = new MsdkProjectPlugin(projectPluginInfo);
  });

  afterEach(async () => {
    if (!isDebug()) {
      await fs.promises.rm(cfsWorkspace.location as string, {
        recursive: true,
        force: true,
      });
    }
  });

  it("Should generate a RISC-V MSDK project", async () => {
    // Generate workspace and project
    const projectPath =
      cfsProject.path +
      "/" +
      (cfsProject.platformConfig as { ProjectName: string }).ProjectName;
    await workspacePlugin.generateWorkspace(cfsWorkspace);
    await projectPlugin.generateProject(projectPath, cfsProject);

    // Check if directory exists
    const projectExists = await directoryExists(projectPath);
    expect(projectExists, "Project directory should exist after generation").to
      .be.true;

    const expectedFiles = [
      ...projectPluginInfo.features.project.templates
        .filter((template) => {
          return template.condition
            ? evalNestedTemplateLiterals(template.condition, cfsProject) ===
                "true"
            : true;
        })
        .map((template) =>
          evalNestedTemplateLiterals(template.dst, cfsProject)
        ),

      ...projectPluginInfo.features.project.files
        .filter((file) => {
          return file.condition
            ? evalNestedTemplateLiterals(file.condition, cfsProject) === "true"
            : true;
        })
        .map((file) => evalNestedTemplateLiterals(file.dst, cfsProject)),
    ];

    for (const file of expectedFiles) {
      const filePath = joinPath(projectPath, file);
      const fileExistsInProject = await fileExists(filePath);

      expect(
        fileExistsInProject,
        `File ${file} should exist in the project directory`
      ).to.be.true;
    }

    // Confirm that valid JSON files were generated
    const jsonFiles = await findJsonFiles(cfsWorkspace.location);
    expect(jsonFiles.length).to.be.greaterThan(0, "No JSON files found");
    for (const file of jsonFiles) {
      const result = await validateJsonFile(file);
      expect(result, `Error: '${file}' is not a valid JSON file.`).to.be.true;
    }
  });

  it("Should generate code for RISC-V MSDK", async () => {
    const socPath = path.resolve(
      `tests/unit-tests/soc/${cfsConfig.Soc.toLowerCase()}-${cfsConfig.Package.toLowerCase()}.json`
    );

    expect(fs.existsSync(socPath), `Soc path does not exist: ${socPath}`).to.be
      .true;

    const socFileContent = await fsp.readFile(socPath, "utf-8");
    const socData = JSON.parse(socFileContent);
    const codeGenerationPath = cfsProject.path;

    projectPlugin = new MsdkProjectPlugin(projectPluginInfo);

    const codeGenData: CfsCodeGenerationContext = {
      cfsconfig: cfsConfig,
      datamodel: socData,
      projectId: "RV",
    };

    const filesGenerated = await projectPlugin.generateCode(
      codeGenData,
      codeGenerationPath
    );

    const expectedFiles = projectPluginInfo.features.codegen.templates
      .filter((template) => {
        return template.condition
          ? evalNestedTemplateLiterals(template.condition, codeGenData) ===
              "true"
          : true;
      })
      .map((template) => evalNestedTemplateLiterals(template.dst, codeGenData));

    const projectName =
      cfsConfig.Projects.find(
        (project) => project.ProjectId === codeGenData.projectId
      )?.PlatformConfig.ProjectName ?? "";
    for (const file of expectedFiles) {
      let filePath = joinPath(
        codeGenerationPath,
        projectName,
        evalNestedTemplateLiterals(file, codeGenData)
      );
      const fileExistsInProject = await fileExists(filePath);
      expect(
        fileExistsInProject,
        `File ${file} should exist in the project directory`
      ).to.be.true;
    }

    expect(
      expectedFiles.every((expectedFile) => {
        return filesGenerated.includes(
          `${codeGenerationPath}/${projectName}/${expectedFile}`
        );
      }),
      `Expected files: ${expectedFiles.join(
        ", "
      )} are not found in generated files: ${filesGenerated.join(", ")}`
    ).to.be.true;
  });

  it("Should return empty array if scope is not found on properties", () => {
    const getPropertiesSpy = sinon.spy(projectPlugin, "getProperties");
    const properties = projectPlugin.getProperties(
      "fakeScope" as CfsFeatureScope
    );
    expect(getPropertiesSpy.called).to.be.true;
    expect(Array.isArray(properties)).to.be.true;
    expect(properties.length).to.equal(0);
    getPropertiesSpy.restore();
  });

  it("Should return properties with populated board name based on board and soc", () => {
    const boardId = "evkit_v1";
    const soc = "max32690";

    const result = projectPlugin.getProperties(CfsFeatureScope.Project, {
      boardId,
      soc,
    });

    const boarnNameProp = result.find((prop) => prop.id === "MsdkBoardName");

    expect(boarnNameProp).to.exist;
    expect(boarnNameProp?.default).to.exist;
    expect(boarnNameProp?.default).to.eq("EvKit_V1");
  });

  describe("overrideControls", () => {
    const mockSoc = {
      Name: "MAX32690",
      Controls: {
        PinConfig: [
          {
            Id: "MODE",
            Description: "Input or Output Mode",
            Type: "enum",
            EnumValues: [
              { Id: "IN", Description: "Input Mode", Value: 0 },
              { Id: "OUT", Description: "Output Mode", Value: 1 },
            ],
          },
          {
            Id: "DS",
            Description: "Drive Strength",
            Type: "enum",
            EnumValues: [
              { Id: "0", Description: "Drive Strength 0", Value: 0 },
              { Id: "1", Description: "Drive Strength 1", Value: 1 },
            ],
          },
        ],
      },
      ClockNodes: [],
      Cores: [],
      Packages: [],
      Peripherals: [],
      Registers: [],
      Schema: "1.0.0",
      Version: "1.0.0",
    };

    it("should handle PinConfig scope", () => {
      const result = projectPlugin.overrideControls(
        CfsFeatureScope.PinConfig,
        mockSoc as unknown as CfsSocDataModel
      ) as Record<string, SocControl[]>;

      expect(result).to.be.an("object");
      expect(result).to.have.property("PinConfig");
      expect(result.PinConfig).to.be.an("array");
      expect(result.PinConfig.length).to.equal(2);
      expect(result.PinConfig[0]).to.have.property("Id", "MODE");
      expect(result.PinConfig[1]).to.have.property("Id", "DS");
    });
  });
});
