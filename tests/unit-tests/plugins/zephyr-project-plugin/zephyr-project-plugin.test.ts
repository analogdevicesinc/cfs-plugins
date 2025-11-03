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
import * as sinon from "sinon";
import {
  CfsPluginInfo,
  CfsFeatureScope,
  CfsConfig,
  CfsCodeGenerationContext,
  GenericPlugin,
  evalNestedTemplateLiterals,
} from "cfs-plugins-api";
import ZephyrProjectPlugin from "../../../../plugins/zephyr-project-plugin/index.js";
import { directoryExists, fileExists } from "../../utilities/test-utilities.js";
import { isDebug } from "../../utilities/test-utilities.js";
import chaiAsPromised from "chai-as-promised";
import { joinPath } from "../../utilities/path-utilities.js";
import {
  validateJsonFile,
  findJsonFiles,
} from "../../utilities/validate-json.js";

chai.use(chaiAsPromised);

describe("Unit test for Arm Zephyr Project Plugin", () => {
  let projectPlugin: ZephyrProjectPlugin;
  let workspacePluginInfo: CfsPluginInfo;
  let projectPluginInfo: CfsPluginInfo;
  let workspacePlugin: GenericPlugin;

  // Define workspace and project configurations
  const cfsProject = {
    id: "CM4",
    package: "WLP",
    board: "AD-APARD32690-SL",
    soc: "MAX32690",
    name: "test-project",
    path: "tests/unit-tests/plugins/zephyr-project-plugin/data/test-workspace",
    pluginId: "test-plugin-id",
    pluginVersion: "1.0.0",
    platformConfig: {
      ProjectName: "m4",
      ZephyrVersion: "4.2.0",
      ZephyrBoardName: "apard32690/max32690/m4",
      CMakeArgs: "",
    },
  };

  const cfsWorkspace = {
    workspacePluginId: "test-plugin-id",
    workspacePluginVersion: "1.0.0",
    workspaceName: "test-workspace",
    location: "tests/unit-tests/plugins/zephyr-project-plugin/data",
    copyrightDate: new Date().getFullYear().toString(),
    dataModelVersion: "1.0.0",
    dataModelSchemaVersion: "1.0.0",
    package: "WLP",
    timestamp: new Date().toISOString(),
    board: "AD-APARD32690-SL",
    soc: "MAX32690",
    projects: [cfsProject],
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
        FirmwarePlatform: "zephyr",
        ExternallyManaged: true,
        Partitions: [{ Name: "Name" } as any],
        PlatformConfig: {
          ProjectName: "m4",
          ZephyrVersion: "4.2.0",
          ZephyrBoardName: "apard32690/max32690/m4",
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
      const projectPluginPath = "plugins/zephyr-project-plugin/.cfsplugin";
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
    workspacePlugin = new GenericPlugin(workspacePluginInfo);
    projectPlugin = new ZephyrProjectPlugin(projectPluginInfo);
  });

  afterEach(async () => {
    if (!isDebug()) {
      await fs.promises.rm(cfsWorkspace.location, {
        recursive: true,
        force: true,
      });
    }
  });

  it("Should generate an Arm Zephyr project", async () => {
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
          evalNestedTemplateLiterals(template.dst, cfsProject),
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
        `File ${file} should exist in the project directory`,
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

  it("Should generate code for Arm Zephyr", async () => {
    const socPath = path.resolve(
      `tests/unit-tests/soc/${cfsConfig.Soc.toLowerCase()}-${cfsConfig.Package.toLowerCase()}.json`,
    );

    expect(fs.existsSync(socPath), `Soc path does not exist: ${socPath}`).to.be
      .true;

    const socFileContent = await fsp.readFile(socPath, "utf-8");
    const socData = JSON.parse(socFileContent);
    const codeGenerationPath = cfsProject.path;

    projectPlugin = new ZephyrProjectPlugin(projectPluginInfo);

    const codeGenData: CfsCodeGenerationContext = {
      cfsconfig: cfsConfig,
      datamodel: socData,
      projectId: "CM4",
      coreId: "CM4",
    };

    const filesGenerated = await projectPlugin.generateCode(
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
      const filePath = joinPath(codeGenerationPath, projectName, file);
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

  it("Should return empty array if scope is not found on properties", () => {
    const plugin = new ZephyrProjectPlugin(projectPluginInfo);
    const getPropertiesSpy = sinon.spy(plugin, "getProperties");
    const properties = plugin.getProperties("fakeScope" as CfsFeatureScope);
    expect(getPropertiesSpy.called).to.be.true;
    expect(Array.isArray(properties)).to.be.true;
    expect(properties.length).to.equal(0);
    getPropertiesSpy.restore();
  });

  it("Should propagate properties to the .cfsconfig file", async () => {
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

    // For each platformConfig property in the cfsProject, check that it exists in the .cfsconfig file
    const cfsConfigPath = joinPath(
      cfsProject.path,
      ".cfs",
      `${cfsWorkspace.workspaceName}.cfsconfig`,
    );
    const cfsConfigExists = await fileExists(cfsConfigPath);
    expect(cfsConfigExists, `${cfsConfigPath} should exist`).to.be.true;
    const cfsConfigContent = await fsp.readFile(cfsConfigPath, "utf-8");
    const cfsConfigObj = JSON.parse(cfsConfigContent) as CfsConfig;
    expect(cfsConfigObj.Projects).to.have.lengthOf(
      cfsWorkspace.projects.length,
    );
    for (const project of cfsConfigObj.Projects) {
      expect(project.PlatformConfig).to.exist;
      for (const [prop, value] of Object.entries(cfsProject.platformConfig)) {
        expect(project.PlatformConfig).to.have.property(prop, value);
      }
    }
  });
});
