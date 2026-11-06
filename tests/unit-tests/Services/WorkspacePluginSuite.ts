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
import type { CfsPluginInfo, CfsWorkspace, CfsProject } from "cfs-types";
import { WorkspaceValidationService } from "@services/WorkspaceValidationService.js";
import { CodeGenerationService } from "@services/CodeGenerationService.js";
import {
  BUILD_TEST_TIMEOUT_MS,
  WorkspaceBuildService,
} from "@services/WorkspaceBuildService.js";
import { joinPath } from "@utilities/path-utilities.js";
import {
  deleteCreatedWorkspace,
  fileExists,
  getSocsBoardsDict,
  isDebug,
  replaceTemplateVariables,
  sanitizeWorkspaceSegment,
  stripVersionRange,
} from "@utilities/test-utilities.js";

type ProjectSpec = Pick<CfsProject, "name" | "path">;

/** One SoC/board pair from the plugin's supported list. */
export interface SocBoard {
  soc: string;
  board: string;
}

/** The project the harness found in the generated .cfsconfig. */
export interface FoundProject {
  ProjectId: string;
  CoreId: string;
  PluginId: string;
  PlatformConfig: { ZephyrBoardName: string; ProjectName?: string };
}

/**
 * One project's code-generation expectations for a multi-project plugin. The
 * project is looked up in the generated .cfsconfig by both ProjectId and
 * pluginId (so a workspace mixing project plugins, e.g. TF-M, still resolves the
 * right one), and its output is checked against `files`.
 */
export interface CodeGenProjectSpec {
  projectId: string;
  pluginId: string;
  files: string[] | ((project: FoundProject) => string[]);
}

/**
 * Code-generation expectations for a plugin whose projects all share one project
 * plugin and are told apart by their CoreId (SHARC-FX: an FX core, plus a CM33
 * core on the ADSP-SC parts). Every project in the generated .cfsconfig using
 * `pluginId` is generated, and the set of CoreIds found is asserted first, so a
 * missing core fails loudly instead of silently generating less.
 */
export interface CodeGenByCoreIdSpec {
  /** The project plugin whose projects are generated - all matching ones. */
  pluginId: string;
  /** Expected generated files for each CoreId, relative to the project folder. */
  files: Record<string, string[]>;
  /** The CoreIds the generated .cfsconfig must hold for this SoC, sorted. */
  expectedCoreIds: (soc: string) => string[];
}

/**
 * One artifact-type build case: set the project's artifact type in its VS Code
 * settings, build it, and check the artifact the toolchain should have produced.
 * This proves the generated Makefile's artifact-type switch really works, which
 * a plain build of the default type never exercises.
 */
export interface BuildArtifactSpec {
  /** Project folder to build, e.g. "sfx" or "m33". */
  project: string;
  /** Artifact type to build, e.g. "executable", "static_library". */
  type: string;
  /** The .vscode/settings.json key holding this project's artifact type. */
  settingKey: string;
  /** The built file to expect, relative to the project folder. */
  output: (project: string) => string;
}

/**
 * The data for one workspace plugin's tests. Only this data changes from plugin
 * to plugin; the shared steps live in runWorkspacePluginSuite. Keep the file
 * lists here (not in the harness) so each plugin's own diff shows what changed.
 *
 * Fields that can differ per SoC/board (the core folder, the file lists) also
 * accept a small function, so a plugin that changes with the SoC can say so
 * without copying the whole flow.
 */
export interface WorkspacePluginSuiteConfig {
  /** Name shown for the test group, e.g. "MSDK Single Core SPI Tests". */
  suiteTitle: string;
  /** Folder the workspace is generated into, e.g. "tests/unit-tests/plugins/<plugin>/data". */
  dataDir: string;
  /**
   * The core folder the plugin makes, e.g. "m4". Pass a function when it depends
   * on the SoC (Zephyr uses zephyrCoreDir). Used to name the one project when
   * `projects` is not given, and to fill the {{core}} placeholder. Omit it when
   * you pass `projects` explicitly (a multi-project plugin) - the folders come
   * from `projects` then.
   */
  core?: string | ((soc: string) => string);
  /**
   * Projects put in the workspace; the first one is the one we build. Leave it
   * out for a single-project plugin and the harness uses one project named after
   * the core folder. Pass a function when the projects depend on the SoC.
   */
  projects?: ProjectSpec[] | ((soc: string) => ProjectSpec[]);
  /**
   * The project plugin id to find inside the generated .cfsconfig. Leave it out
   * for a plugin with no code generation (the workspace is built as-is).
   */
  projectPluginId?: string;
  /**
   * Start of the build workspace name, e.g. "spi" -> spi_<soc>_<board>. Only
   * used by the build test, so it can be omitted when buildable is not set.
   */
  buildWorkspacePrefix?: string;
  /**
   * Every file the workspace should have. You can use {{soc}}, {{board}},
   * {{package}}, {{core}} and {{workspaceName}} - they are filled in for each
   * SoC/board. Pass a function when the list changes with the SoC.
   */
  expectedWorkspaceFiles: string[] | ((combo: SocBoard) => string[]);
  /**
   * The files code generation should make for the project. Pass a function to
   * work them out from the found project (Zephyr names them after the board).
   * Leave it out when the plugin has no code generation.
   */
  expectedCodeGenFiles?: string[] | ((project: FoundProject) => string[]);
  /**
   * For a multi-project plugin (more than one project generating code): the
   * per-project code-gen expectations. Use this instead of projectPluginId +
   * expectedCodeGenFiles. Each project's output is checked in its own folder
   * (the project's ProjectName). The first entry in `projects` is the one built.
   */
  codeGenProjects?: CodeGenProjectSpec[];
  /**
   * For a plugin whose projects share one project plugin and differ by CoreId
   * (SHARC-FX). Use this instead of projectPluginId + expectedCodeGenFiles, or
   * codeGenProjects, when the set of projects depends on the SoC.
   */
  codeGenByCoreId?: CodeGenByCoreIdSpec;
  /**
   * Set to true to also add the build test (it only runs when CFS_RUN_BUILD is
   * on). Leave it off for plugins that are not meant to compile.
   */
  buildable?: boolean;
  /**
   * Build one case per artifact type instead of a single default build. Implies
   * buildable, and replaces the plain build test with a matrix over these specs.
   */
  buildArtifacts?: BuildArtifactSpec[];
}

/**
 * Runs the standard workspace-plugin tests: make the workspace, generate the
 * code, and (if asked) build it - once for every SoC/board the plugin supports.
 *
 * Each plugin just calls this with its own data, so a test that used to be ~358
 * copy-pasted lines becomes a short list of facts. There is still one test per
 * SoC/board, so a failure still points at the exact combo.
 *
 * @param pluginInfo - The plugin manifest (load it with loadPluginInfo).
 * @param config - The plugin's own test data.
 */
export function runWorkspacePluginSuite(
  pluginInfo: CfsPluginInfo,
  config: WorkspacePluginSuiteConfig,
): void {
  const supportedSocs = getSocsBoardsDict(pluginInfo);
  const isMultiProject = config.codeGenProjects !== undefined;
  const byCoreId = config.codeGenByCoreId;
  const hasCodeGen =
    config.projectPluginId !== undefined ||
    isMultiProject ||
    byCoreId !== undefined;

  const coreFor = (soc: string): string => {
    if (config.core !== undefined) {
      return typeof config.core === "function" ? config.core(soc) : config.core;
    }
    // No explicit core: fall back to the first project's folder name.
    const projs =
      typeof config.projects === "function"
        ? config.projects(soc)
        : config.projects;
    if (projs && projs.length > 0) {
      return projs[0].name;
    }
    throw new Error(
      "runWorkspacePluginSuite: provide `core` or `projects` in the config",
    );
  };

  const projectsFor = (soc: string): ProjectSpec[] => {
    if (config.projects === undefined) {
      const core = coreFor(soc);
      return [{ name: core, path: `./${core}` }];
    }
    return typeof config.projects === "function"
      ? config.projects(soc)
      : config.projects;
  };

  const workspaceFilesFor = (combo: SocBoard): string[] =>
    typeof config.expectedWorkspaceFiles === "function"
      ? config.expectedWorkspaceFiles(combo)
      : config.expectedWorkspaceFiles;

  const codeGenFilesFor = (project: FoundProject): string[] => {
    if (config.expectedCodeGenFiles === undefined) {
      return [];
    }
    return typeof config.expectedCodeGenFiles === "function"
      ? config.expectedCodeGenFiles(project)
      : config.expectedCodeGenFiles;
  };

  describe(config.suiteTitle, () => {
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

    const requireSocInfo = (soc: string, board: string) => {
      const socInfo = pluginInfo.supportedSocs.find(
        (s) => s.name === soc && s.board === board,
      );
      if (!socInfo) {
        expect.fail(
          `No supportedSocs entry found for soc="${soc}" board="${board}"`,
        );
      }
      return socInfo;
    };

    const makeWorkspace = (
      soc: string,
      board: string,
      socInfo: NonNullable<ReturnType<typeof requireSocInfo>>,
      location: string,
      workspaceName: string,
    ): CfsWorkspace => ({
      location,
      workspacePluginId: pluginInfo.pluginId,
      workspacePluginVersion: pluginInfo.pluginVersion,
      workspaceName,
      copyrightDate: new Date().getFullYear().toString(),
      dataModelVersion: stripVersionRange(socInfo.dataModelVersion),
      package: socInfo.package.toLowerCase(),
      timestamp: new Date().toISOString(),
      board,
      soc,
      projects: projectsFor(soc),
    });

    // Shared step for the code-gen and build blocks: make the workspace, read the
    // .cfsconfig it wrote (code gen needs it as input), then generate the code.
    // Hands back the generated files, the path and the found project so the caller
    // can check them or build. Only the build path sets withBoardDts - that parses
    // the Zephyr board devicetree with cfsutil so the output matches the real
    // product. The plain code-gen check leaves it off so it never needs cfsutil.
    const generateAndGenerateCode = async (
      workspace: CfsWorkspace,
      withBoardDts = false,
      onWorkspaceReady?: (codeGenerationPath: string) => void,
    ): Promise<{
      generatedFiles: string[];
      codeGenerationPath: string;
      project: FoundProject;
    }> => {
      await genericPlugin.generateWorkspace(workspace);

      const codeGenerationPath = joinPath(
        workspace.location,
        workspace.workspaceName,
      );

      // The build path uses this to install the declared packages before code
      // generation runs, so boardDts is parsed from the Zephyr the workspace
      // actually asks for.
      onWorkspaceReady?.(codeGenerationPath);
      const cfsConfigFile = joinPath(
        codeGenerationPath,
        ".cfs",
        `${workspace.soc.toLowerCase()}-${workspace.package}.cfsconfig`,
      );
      const cfsConfig = JSON.parse(await fs.readFile(cfsConfigFile, "utf-8"));

      const project = cfsConfig.Projects.find(
        (p: { PluginId: string }) => p.PluginId === config.projectPluginId,
      );
      if (!project) {
        expect.fail(
          `No project found in cfsconfig with PluginId: ${config.projectPluginId}`,
        );
      }

      const socDataModelPath = joinPath(
        "data-models",
        "socs",
        `${workspace.soc.toLowerCase()}-${workspace.package}.json`,
      );
      const socDataModel = JSON.parse(
        await fs.readFile(socDataModelPath, "utf-8"),
      );

      const codeGenService = new CodeGenerationService();
      const generatedFiles = await codeGenService.runCodeGeneration(
        {
          pluginId: config.projectPluginId,
          cfsconfig: cfsConfig,
          projectId: project.ProjectId,
          coreId: project.CoreId,
        },
        socDataModel,
        codeGenerationPath,
        { withBoardDts },
      );

      return { generatedFiles, codeGenerationPath, project };
    };

    // Multi-project variant: generate the workspace once, then run code
    // generation for every configured project (each may use its own project
    // plugin). Returns each spec paired with its found project and generated
    // files so the caller can validate per project or build.
    const generateAndCodegenMulti = async (
      workspace: CfsWorkspace,
      withBoardDts = false,
      onWorkspaceReady?: (codeGenerationPath: string) => void,
    ): Promise<{
      results: {
        spec: CodeGenProjectSpec;
        project: FoundProject;
        generatedFiles: string[];
      }[];
      codeGenerationPath: string;
    }> => {
      await genericPlugin.generateWorkspace(workspace);

      const codeGenerationPath = joinPath(
        workspace.location,
        workspace.workspaceName,
      );

      // See generateAndGenerateCode: the build path installs declared packages
      // here, before any code generation reads them.
      onWorkspaceReady?.(codeGenerationPath);
      const cfsConfigFile = joinPath(
        codeGenerationPath,
        ".cfs",
        `${workspace.soc.toLowerCase()}-${workspace.package}.cfsconfig`,
      );
      const cfsConfig = JSON.parse(await fs.readFile(cfsConfigFile, "utf-8"));

      const socDataModelPath = joinPath(
        "data-models",
        "socs",
        `${workspace.soc.toLowerCase()}-${workspace.package}.json`,
      );
      const socDataModel = JSON.parse(
        await fs.readFile(socDataModelPath, "utf-8"),
      );

      const codeGenService = new CodeGenerationService();
      const results = [];
      for (const spec of config.codeGenProjects ?? []) {
        const project = cfsConfig.Projects.find(
          (p: { ProjectId: string; PluginId: string }) =>
            p.ProjectId === spec.projectId && p.PluginId === spec.pluginId,
        );
        if (!project) {
          expect.fail(
            `No project found in cfsconfig with ProjectId: ${spec.projectId} and PluginId: ${spec.pluginId}`,
          );
        }
        const generatedFiles = await codeGenService.runCodeGeneration(
          {
            pluginId: spec.pluginId,
            cfsconfig: cfsConfig,
            projectId: project.ProjectId,
            coreId: project.CoreId,
          },
          socDataModel,
          codeGenerationPath,
          { withBoardDts },
        );
        results.push({ spec, project, generatedFiles });
      }

      return { results, codeGenerationPath };
    };

    // By-CoreId variant: generate the workspace, then run code generation for
    // every project using the configured project plugin, after checking the
    // CoreIds present are exactly the ones this SoC should have. Returns each
    // project with its generated files so the caller can validate or build.
    const generateAndCodegenByCoreId = async (
      workspace: CfsWorkspace,
      spec: CodeGenByCoreIdSpec,
      withBoardDts = false,
      onWorkspaceReady?: (codeGenerationPath: string) => void,
    ): Promise<{
      results: { project: FoundProject; generatedFiles: string[] }[];
      codeGenerationPath: string;
    }> => {
      await genericPlugin.generateWorkspace(workspace);

      const codeGenerationPath = joinPath(
        workspace.location,
        workspace.workspaceName,
      );

      // See generateAndGenerateCode: the build path installs declared packages
      // here, before any code generation reads them.
      onWorkspaceReady?.(codeGenerationPath);
      const cfsConfigFile = joinPath(
        codeGenerationPath,
        ".cfs",
        `${workspace.soc.toLowerCase()}-${workspace.package}.cfsconfig`,
      );
      const cfsConfig = JSON.parse(await fs.readFile(cfsConfigFile, "utf-8"));

      const projects: FoundProject[] = cfsConfig.Projects.filter(
        (p: { PluginId: string }) => p.PluginId === spec.pluginId,
      );
      expect(
        projects.map((p) => p.CoreId).sort(),
        `Core IDs in cfsconfig for ${workspace.soc} do not match expected`,
      ).to.deep.equal(spec.expectedCoreIds(workspace.soc));

      const socDataModelPath = joinPath(
        "data-models",
        "socs",
        `${workspace.soc.toLowerCase()}-${workspace.package}.json`,
      );
      const socDataModel = JSON.parse(
        await fs.readFile(socDataModelPath, "utf-8"),
      );

      const codeGenService = new CodeGenerationService();
      const results = [];
      for (const project of projects) {
        const generatedFiles = await codeGenService.runCodeGeneration(
          {
            pluginId: spec.pluginId,
            cfsconfig: cfsConfig,
            projectId: project.ProjectId,
            coreId: project.CoreId,
          },
          socDataModel,
          codeGenerationPath,
          { withBoardDts },
        );
        results.push({ project, generatedFiles });
      }

      return { results, codeGenerationPath };
    };

    describe("GenerateWorkspace_BasicFlow_ShouldGenerateExpectedFiles", () => {
      const workspaceValidationService = new WorkspaceValidationService();

      Object.entries(supportedSocs).forEach(([soc, boards]) => {
        boards.forEach((board) => {
          it(`${soc} SoC with ${board} board`, async () => {
            const socInfo = requireSocInfo(soc, board);
            const core = coreFor(soc);
            const workspaceName = `${soc.toLowerCase()}-${sanitizeWorkspaceSegment(board)}-workspace-gen`;

            cfsWorkspace = makeWorkspace(
              soc,
              board,
              socInfo,
              config.dataDir,
              workspaceName,
            );

            const expectedWorkspaceFiles = workspaceFilesFor({
              soc,
              board,
            }).map((file) =>
              replaceTemplateVariables(file, {
                soc: soc.toLowerCase(),
                board: sanitizeWorkspaceSegment(board),
                package: cfsWorkspace!.package,
                core,
                workspaceName,
              }),
            );

            await genericPlugin.generateWorkspace(cfsWorkspace);

            await workspaceValidationService.validateWorkspaceFiles(
              cfsWorkspace,
              expectedWorkspaceFiles,
            );

            // Check each project's folder is populated and no stray top-level
            // folders appear. For a single-project plugin this is one check on
            // the core folder; a multi-project plugin checks each, excluding the
            // sibling project folders.
            const projectDirs = projectsFor(soc).map((p) => p.name);
            for (const dir of projectDirs) {
              await workspaceValidationService.validateDirectoryStructure(
                cfsWorkspace,
                dir,
                [".cfs", ...projectDirs.filter((d) => d !== dir)],
              );
            }
          });
        });
      });
    });

    if (byCoreId) {
      describe("GenerateCode_BasicFlow_ShouldGenerateExpectedFiles", () => {
        const codeGenService = new CodeGenerationService();
        Object.entries(supportedSocs).forEach(([soc, boards]) => {
          boards.forEach((board) => {
            it(`${soc} SoC with ${board} board`, async () => {
              const socInfo = requireSocInfo(soc, board);
              const workspaceName = `${soc.toLowerCase()}-${sanitizeWorkspaceSegment(board)}-project-gen`;

              cfsWorkspace = makeWorkspace(
                soc,
                board,
                socInfo,
                config.dataDir,
                workspaceName,
              );

              const { results, codeGenerationPath } =
                await generateAndCodegenByCoreId(cfsWorkspace, byCoreId);

              for (const { project, generatedFiles } of results) {
                const expected = byCoreId.files[project.CoreId];
                expect(
                  expected,
                  `No expected files defined for CoreId "${project.CoreId}"`,
                ).to.not.equal(undefined);

                await codeGenService.validateGeneratedFiles(
                  generatedFiles,
                  expected,
                  joinPath(
                    codeGenerationPath,
                    project.PlatformConfig.ProjectName ?? project.ProjectId,
                  ),
                );
              }
            });
          });
        });
      });
    }

    if (hasCodeGen && !isMultiProject && !byCoreId) {
      describe("GenerateCode_BasicFlow_ShouldGenerateExpectedFiles", () => {
        Object.entries(supportedSocs).forEach(([soc, boards]) => {
          boards.forEach((board) => {
            it(`${soc} SoC with ${board} board`, async () => {
              const socInfo = requireSocInfo(soc, board);
              const workspaceName = `${soc.toLowerCase()}-${sanitizeWorkspaceSegment(board)}-project-gen`;

              cfsWorkspace = makeWorkspace(
                soc,
                board,
                socInfo,
                config.dataDir,
                workspaceName,
              );

              const { generatedFiles, codeGenerationPath, project } =
                await generateAndGenerateCode(cfsWorkspace);

              await new CodeGenerationService().validateGeneratedFiles(
                generatedFiles,
                codeGenFilesFor(project),
                joinPath(codeGenerationPath, projectsFor(soc)[0].name),
              );
            });
          });
        });
      });
    }

    if (isMultiProject) {
      describe("GenerateCode_BasicFlow_ShouldGenerateExpectedFiles", () => {
        const codeGenService = new CodeGenerationService();
        Object.entries(supportedSocs).forEach(([soc, boards]) => {
          boards.forEach((board) => {
            it(`${soc} SoC with ${board} board`, async () => {
              const socInfo = requireSocInfo(soc, board);
              const workspaceName = `${soc.toLowerCase()}-${sanitizeWorkspaceSegment(board)}-project-gen`;

              cfsWorkspace = makeWorkspace(
                soc,
                board,
                socInfo,
                config.dataDir,
                workspaceName,
              );

              const { results, codeGenerationPath } =
                await generateAndCodegenMulti(cfsWorkspace);

              for (const { spec, project, generatedFiles } of results) {
                const expected =
                  typeof spec.files === "function"
                    ? spec.files(project)
                    : spec.files;
                await codeGenService.validateGeneratedFiles(
                  generatedFiles,
                  expected,
                  joinPath(
                    codeGenerationPath,
                    project.PlatformConfig.ProjectName ?? spec.projectId,
                  ),
                );
              }
            });
          });
        });
      });
    }

    if (config.buildArtifacts) {
      const buildArtifacts = config.buildArtifacts;
      const { runBuild, cfsUtil, buildWorkspaceLocation } =
        WorkspaceBuildService.getBuildConfig(config.dataDir);

      (runBuild ? describe : describe.skip)(
        "BuildCode_BasicFlow_ArtifactType_ShouldSucceed",
        () => {
          const workspaceBuildService = new WorkspaceBuildService();

          before(function () {
            WorkspaceBuildService.assertBuildEnabled(cfsUtil);
          });

          Object.entries(supportedSocs).forEach(([soc, boards]) => {
            boards.forEach((board) => {
              buildArtifacts.forEach(
                ({ project, type, settingKey, output }) => {
                  it(`${soc} ${board} ${project.toUpperCase()} ${type} artifact builds successfully`, async () => {
                    const socInfo = requireSocInfo(soc, board);
                    const workspaceName = `${config.buildWorkspacePrefix ?? "build"}_${soc.toLowerCase()}_${sanitizeWorkspaceSegment(board)}_${project}_${type}`;

                    cfsWorkspace = makeWorkspace(
                      soc,
                      board,
                      socInfo,
                      buildWorkspaceLocation,
                      workspaceName,
                    );

                    // Same ordering as the plain build test: install the declared
                    // packages before any code generation reads them.
                    const prepareDependencies = (
                      generatedPath: string,
                    ): void => {
                      workspaceBuildService.prepareDependencies(
                        cfsUtil!,
                        path.resolve(generatedPath),
                      );
                    };

                    let codeGenerationPath: string;
                    if (byCoreId) {
                      ({ codeGenerationPath } =
                        await generateAndCodegenByCoreId(
                          cfsWorkspace,
                          byCoreId,
                          true,
                          prepareDependencies,
                        ));
                    } else if (isMultiProject) {
                      ({ codeGenerationPath } = await generateAndCodegenMulti(
                        cfsWorkspace,
                        true,
                        prepareDependencies,
                      ));
                    } else if (hasCodeGen) {
                      ({ codeGenerationPath } = await generateAndGenerateCode(
                        cfsWorkspace,
                        true,
                        prepareDependencies,
                      ));
                    } else {
                      await genericPlugin.generateWorkspace(cfsWorkspace);
                      codeGenerationPath = joinPath(
                        cfsWorkspace.location,
                        cfsWorkspace.workspaceName,
                      );
                    }

                    const workspaceDir = path.resolve(codeGenerationPath);
                    const projectPath = path.join(workspaceDir, project);

                    // Pick the artifact type the way a user would - through the
                    // project's VS Code setting the generated build task reads -
                    // rather than by passing make a variable the product never
                    // sets itself.
                    const settingsPath = path.join(
                      projectPath,
                      ".vscode",
                      "settings.json",
                    );
                    const settings = JSON.parse(
                      await fs.readFile(settingsPath, "utf-8"),
                    );
                    settings[settingKey] = type;
                    await fs.writeFile(
                      settingsPath,
                      JSON.stringify(settings, null, 2),
                      "utf-8",
                    );

                    workspaceBuildService.buildProject(
                      cfsUtil!,
                      workspaceDir,
                      projectPath,
                    );

                    const expectedFile = path.join(
                      projectPath,
                      output(project),
                    );
                    expect(
                      await fileExists(expectedFile),
                      `Expected ${type} output at ${expectedFile}`,
                    ).to.equal(true);
                  }).timeout(BUILD_TEST_TIMEOUT_MS);
                },
              );
            });
          });
        },
      );
    } else if (config.buildable) {
      const { runBuild, cfsUtil, buildWorkspaceLocation } =
        WorkspaceBuildService.getBuildConfig(config.dataDir);

      (runBuild ? describe : describe.skip)(
        "BuildCode_BasicFlow_ShouldSucceed",
        () => {
          const workspaceBuildService = new WorkspaceBuildService();

          before(function () {
            WorkspaceBuildService.assertBuildEnabled(cfsUtil);
          });

          Object.entries(supportedSocs).forEach(([soc, boards]) => {
            boards.forEach((board) => {
              it(`${soc} SoC with ${board} board`, async () => {
                const socInfo = requireSocInfo(soc, board);
                const workspaceName = `${config.buildWorkspacePrefix ?? "build"}_${soc.toLowerCase()}_${sanitizeWorkspaceSegment(board)}`;

                cfsWorkspace = makeWorkspace(
                  soc,
                  board,
                  socInfo,
                  buildWorkspaceLocation,
                  workspaceName,
                );

                // Install the workspace's declared packages as soon as it
                // exists, before code generation reads any of them. boardDts is
                // parsed from the installed Zephyr, so reconciling only at build
                // time would let the overlay be generated against whatever
                // version happened to be installed.
                const prepareDependencies = (generatedPath: string): void => {
                  workspaceBuildService.prepareDependencies(
                    cfsUtil!,
                    path.resolve(generatedPath),
                  );
                };

                // Plugins with code generation run it before building so the
                // build sees the generated sources (a multi-project plugin
                // generates every project first, since the first project's build
                // may pull the others in); a plugin without code generation
                // (e.g. a library) builds the workspace as-is.
                let codeGenerationPath: string;
                if (byCoreId) {
                  ({ codeGenerationPath } = await generateAndCodegenByCoreId(
                    cfsWorkspace,
                    byCoreId,
                    true,
                    prepareDependencies,
                  ));
                } else if (isMultiProject) {
                  ({ codeGenerationPath } = await generateAndCodegenMulti(
                    cfsWorkspace,
                    true,
                    prepareDependencies,
                  ));
                } else if (hasCodeGen) {
                  ({ codeGenerationPath } = await generateAndGenerateCode(
                    cfsWorkspace,
                    true,
                    prepareDependencies,
                  ));
                } else {
                  await genericPlugin.generateWorkspace(cfsWorkspace);
                  codeGenerationPath = joinPath(
                    cfsWorkspace.location,
                    cfsWorkspace.workspaceName,
                  );
                }

                const workspaceDir = path.resolve(codeGenerationPath);
                workspaceBuildService.buildProject(
                  cfsUtil!,
                  workspaceDir,
                  path.join(workspaceDir, projectsFor(soc)[0].name),
                );
              }).timeout(BUILD_TEST_TIMEOUT_MS);
            });
          });
        },
      );
    }
  });
}
