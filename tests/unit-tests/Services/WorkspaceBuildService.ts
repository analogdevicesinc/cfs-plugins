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
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import semver from "semver";
import { readPackageIndex } from "@utilities/package-index.js";

export const BUILD_TIMEOUT_MS = 600000;
export const PKG_TIMEOUT_MS = 300000;
export const WEST_TIMEOUT_MS = 900000;
export const AI_BUILD_TIMEOUT_MS = 900000;
export const VALIDATE_TIMEOUT_MS = 120000;
export const BUILD_TEST_TIMEOUT_MS = 0;

// Optional Zephyr modules a TFLM build needs. They are filtered out of the
// west workspace by default, so they must be allowlisted and fetched before a
// workspace that sets CONFIG_TENSORFLOW_LITE_MICRO can configure.
const TFLM_WEST_MODULES = ["cmsis-dsp", "cmsis-nn", "tflite-micro"];

// `cfsutil validate config` reports this when it cannot load the SoC data model
// the .cfsconfig declares. It is only a warning and the command still exits 0,
// but it means the run fell back to schema checking alone — see validateConfig.
const DATA_MODEL_UNAVAILABLE = "data-model-unavailable";

interface DeclaredPackage {
  name: string;
  version: string;
}

// `cfsutil validate` emits one of two JSON shapes on stdout: the report below
// when validation actually ran, or CfsUtilError when the command could not run
// at all (e.g. the path holds no .cfs directory).
interface ValidateDiagnostic {
  severity?: string;
  ruleId?: string;
  message?: string;
  instancePath?: string;
}

interface ValidateConfigReport {
  valid?: boolean;
  results?: {
    path?: string;
    valid?: boolean;
    diagnostics?: ValidateDiagnostic[];
  }[];
}

interface CfsUtilRecovery {
  suggestion?: string;
  run?: string;
}

interface CfsUtilError {
  level?: string;
  msg?: string;
  recovery?: CfsUtilRecovery;
}

interface CfsConfigProjects {
  Projects?: { AIModels?: { Enabled?: string | boolean }[] }[];
}

export interface BuildConfig {
  runBuild: boolean;
  cfsUtil: string | undefined;
  buildWorkspaceLocation: string;
}

export class WorkspaceBuildService {
  private readonly validatedWorkspaces = new Set<string>();

  /**
   * Reads the build-test environment configuration (`CFS_RUN_BUILD`,
   * `CFS_UTIL_CMD`, `CFS_BUILD_WORKSPACE_DIR`).
   *
   * @param defaultWorkspaceLocation - Fallback workspace location (the plugin's
   *   in-repo `data` dir) used when `CFS_BUILD_WORKSPACE_DIR` is not set.
   */
  public static getBuildConfig(defaultWorkspaceLocation: string): BuildConfig {
    return {
      runBuild: process.env.CFS_RUN_BUILD === "true",
      cfsUtil: process.env.CFS_UTIL_CMD,
      buildWorkspaceLocation:
        process.env.CFS_BUILD_WORKSPACE_DIR || defaultWorkspaceLocation,
    };
  }

  /**
   * Guard for the `before()` hook: fails fast with a clear message if the build
   * test is enabled but no cfsutil command was configured, rather than an
   * opaque `execFileSync` error deep in the first test case.
   */
  public static assertBuildEnabled(cfsUtil: string | undefined): void {
    if (!cfsUtil) {
      throw new Error(
        "CFS_RUN_BUILD=true but CFS_UTIL_CMD is not set. " +
          'Set CFS_UTIL_CMD to the cfsutil command (e.g. "cfsutil").',
      );
    }
  }

  /**
   * Installs the packages the generated workspace declares, without building.
   *
   * Call this after `generateWorkspace` but before code generation whenever the
   * generated output depends on an installed package. The Zephyr `boardDts`
   * input is the case that matters: it is parsed from the *installed* Zephyr
   * package, so if code generation runs first it can read the board devicetree
   * of whatever Zephyr happens to be installed — a stale or simply different
   * version — and the overlay is then generated from the wrong board. The
   * reconcile inside `buildProject` runs too late to repair that, since the
   * overlay already exists by then.
   *
   * Safe to call before `buildProject`: the reconcile is idempotent and returns
   * early once every declared package is satisfied, so `buildProject` keeps
   * owning the contract for callers that don't need this ordering.
   *
   * Also schema-validates the generated config here, which is the earliest
   * point it can be checked meaningfully (see `validateConfig`).
   *
   * @param cfsUtil - The resolved cfsutil command.
   * @param workspaceDir - Absolute path to the generated workspace directory.
   */
  public prepareDependencies(cfsUtil: string, workspaceDir: string): void {
    this.reconcileDependencies(cfsUtil, workspaceDir);
    this.validateConfig(cfsUtil, workspaceDir);
  }

  /**
   * Reconciles the installed CFS packages to match the workspace's generated
   * `.cfsdependencies`, schema-validates the generated config (see
   * `validateConfig`), fetches the optional Zephyr modules a TFLM project
   * needs (see `ensureTflmModules`), compiles any declared AI model into
   * source (see `ensureAiSources`), then compiles the project via
   * `cfsutil tasks run build`.
   * The reconcile first removes any installed package the workspace does not
   * declare, or whose installed version does not satisfy the declared spec, then
   * installs the manifest itself when anything is still missing — removing
   * before installing so a stale transitive dependency (e.g. an older
   * `zephyr_arm_toolchain`) cannot conflict with a package installed afterwards.
   * Each build therefore sees exactly its declared dependency set. No package is
   * special-cased: a workspace that
   * declares a non-buildable version fails the build here rather than being
   * masked. Uses an argument array (no shell on Linux/CI, a shell on Windows for
   * the `.cmd`) so paths with spaces are passed literally, and inherits stdio so
   * the real toolchain error surfaces on failure. Prints labeled markers so
   * parallel (`mocha --parallel`) runs stay traceable.
   *
   * @param cfsUtil - The resolved cfsutil command.
   * @param workspaceDir - Absolute path to the generated workspace directory.
   * @param projectPath - Absolute path to the project to build.
   */
  public buildProject(
    cfsUtil: string,
    workspaceDir: string,
    projectPath: string,
  ): void {
    this.reconcileDependencies(cfsUtil, workspaceDir);
    this.validateConfig(cfsUtil, workspaceDir);
    this.ensureTflmModules(workspaceDir, projectPath);
    this.ensureAiSources(cfsUtil, workspaceDir);
    const label = workspaceDir.split(/[\\/]/).filter(Boolean).pop();
    console.log(`[build:start] ${label}`);
    execFileSync(cfsUtil, ["tasks", "run", "build", "-w", projectPath], {
      cwd: workspaceDir,
      stdio: "inherit",
      timeout: BUILD_TIMEOUT_MS,
      shell: process.platform === "win32",
    });
    console.log(`[build:ok] ${label}`);
  }

  /**
   * Checks the generated `.cfsconfig` against the CFS schema with
   * `cfsutil validate config`, closing the gap the file-shape assertions leave:
   * a config that is well-formed JSON with every expected file present can
   * still violate the schema, which is how such defects have reached releases
   * before — found by hand rather than by this suite.
   *
   * Runs *after* the reconcile, not before it. The validator resolves the SoC
   * data model from an installed package, and when it cannot it does not fail —
   * it reports a `data-model-unavailable` warning, exits 0 and has checked the
   * schema alone. Validating before the reconcile would therefore check against
   * whichever packages the previous test happened to leave installed, silently
   * weakening the check. Running afterwards costs nothing extra: the build
   * needs those packages regardless, and this still runs before code generation
   * and long before the compile.
   *
   * Validated once per workspace (`prepareDependencies` and `buildProject` both
   * call it) because code generation only reads the config and never rewrites
   * it, so a second run would re-check identical bytes. Only a *successful*
   * check is remembered: caching a rejection would let a retry of the same
   * workspace skip the validator and pass on the same invalid config.
   *
   * @param cfsUtil - The resolved cfsutil command.
   * @param workspaceDir - Absolute path to the generated workspace directory.
   */
  private validateConfig(cfsUtil: string, workspaceDir: string): void {
    const resolved = path.resolve(workspaceDir);
    if (this.validatedWorkspaces.has(resolved)) {
      return;
    }

    const label = path.basename(resolved);
    // Not every workspace plugin emits a .cfsconfig - a library plugin such as
    // msdk-single-core-library-generate deliberately ships none. There is
    // nothing to schema-check in that case, and cfsutil treats the absence as a
    // hard error, so skip rather than fail. The reconcile has already proven
    // the .cfs directory itself exists, since it reads .cfsdependencies there.
    if (this.findCfsConfig(resolved) === undefined) {
      this.validatedWorkspaces.add(resolved);
      console.log(`[validate:config] ${label} skipped — no .cfsconfig`);
      return;
    }

    const { stdout, failed } = this.runValidate(cfsUtil, [
      "validate",
      "config",
      "-w",
      resolved,
      "-f",
      "json",
    ]);
    const report = this.parseValidateJson<ValidateConfigReport & CfsUtilError>(
      stdout,
    );
    if (report === undefined) {
      throw new Error(this.validationFailure(label, [], stdout));
    }

    const diagnostics = (report.results ?? []).flatMap(
      (result) => result.diagnostics ?? [],
    );
    const problems = this.describeCommandError(report).concat(
      diagnostics
        .filter((diagnostic) => diagnostic.severity !== "warning")
        .map((diagnostic) => this.describeDiagnostic(diagnostic)),
    );

    // A report that omits `valid` is the error shape, not a pass: fail closed.
    // Marked validated only past this point, so a rejection is never cached:
    // a retry of the same workspace must re-run the validator, not skip it.
    if (failed || !report.valid || problems.length > 0) {
      throw new Error(this.validationFailure(label, problems, stdout));
    }
    this.validatedWorkspaces.add(resolved);

    for (const diagnostic of diagnostics) {
      console.log(
        `[validate:config] ${label} warn — ${this.describeDiagnostic(diagnostic)}`,
      );
    }
    if (
      diagnostics.some(
        (diagnostic) => diagnostic.ruleId === DATA_MODEL_UNAVAILABLE,
      )
    ) {
      console.log(
        `[validate:config] ${label} degraded — schema only, the declared SoC data model did not load`,
      );
    }
    console.log(`[validate:config] ${label} ok`);
  }

  /**
   * Runs a `cfsutil validate` subcommand, separating a validation verdict from
   * a failure to run at all. A non-zero exit is a verdict and is returned with
   * the JSON payload cfsutil writes to stdout; anything without an exit status
   * (spawn failure, timeout) is re-thrown, since that is a broken environment
   * rather than an invalid workspace.
   */
  private runValidate(
    cfsUtil: string,
    args: string[],
  ): { stdout: string; failed: boolean } {
    try {
      return {
        stdout: execFileSync(cfsUtil, args, {
          stdio: "pipe",
          timeout: VALIDATE_TIMEOUT_MS,
          shell: process.platform === "win32",
          encoding: "utf-8",
        }),
        failed: false,
      };
    } catch (error) {
      const execError = error as { status?: number | null; stdout?: string };
      if (typeof execError.status !== "number") {
        throw error;
      }
      return { stdout: execError.stdout ?? "", failed: true };
    }
  }

  private parseValidateJson<T>(stdout: string): T | undefined {
    try {
      return JSON.parse(stdout) as T;
    } catch {
      return undefined;
    }
  }

  private describeCommandError(report: CfsUtilError): string[] {
    if (report.msg === undefined) {
      return [];
    }
    const described = [`${report.level ?? "ERROR"}: ${report.msg}`];
    const recovery: CfsUtilRecovery = report.recovery ?? {};
    if (recovery.suggestion !== undefined) {
      described.push(`Suggestion: ${recovery.suggestion}`);
    }
    return described;
  }

  private describeDiagnostic(diagnostic: ValidateDiagnostic): string {
    const origin = [diagnostic.severity, diagnostic.ruleId]
      .filter(Boolean)
      .join("/");
    const where =
      diagnostic.instancePath === undefined || diagnostic.instancePath === ""
        ? ""
        : ` at ${diagnostic.instancePath}`;
    return `${origin}${where}: ${diagnostic.message}`;
  }

  private validationFailure(
    label: string,
    problems: string[],
    stdout: string,
  ): string {
    const detail =
      problems.length > 0 ? problems : [stdout.trim() || "(no output)"];
    return [`cfsutil validate config rejected ${label}:`, ...detail].join(
      "\n  ",
    );
  }

  /**
   * Build-test-only: compiles the workspace's declared AI models into C/C++
   * sources with `cfsutil ai build`, the step the plugin API cannot perform.
   *
   * Generating a workspace is two steps in every product path — the plugin
   * emits its files, then cfsutil's AI backend turns each declared `.tflite`
   * or `.pth.tar` into source (`src/adi_tflm/*` for the `tflm` backend,
   * `adi_cnn/*` for `izer`). Both the IDE (workspace creation and System
   * Planner) and `cfsutil generate` run the pair; the harness calls only the
   * plugin, so without this the generated `aimodels.mk` points `-I`/`VPATH` at
   * a directory nobody created and the compile fails on a missing
   * `adi_tflm.hpp`. Applicability mirrors the product: run only when some
   * project declares a model that is not explicitly disabled. Opt-in to the
   * build path (codegen validation keeps asserting the plugin's own output,
   * which must not include these files) and cheap for every other plugin,
   * which returns on the model check.
   */
  private ensureAiSources(cfsUtil: string, workspaceDir: string): void {
    const configPath = this.findCfsConfig(workspaceDir);
    if (configPath === undefined || !this.declaresEnabledAiModel(configPath)) {
      return;
    }

    console.log(`[ai:build] ${path.basename(workspaceDir)}`);
    execFileSync(cfsUtil, ["ai", "build", "--config", configPath], {
      cwd: workspaceDir,
      stdio: "inherit",
      timeout: AI_BUILD_TIMEOUT_MS,
      shell: process.platform === "win32",
    });
  }

  private findCfsConfig(workspaceDir: string): string | undefined {
    const configDir = path.join(workspaceDir, ".cfs");
    try {
      const match = readdirSync(configDir).find((entry) =>
        entry.endsWith(".cfsconfig"),
      );
      return match === undefined ? undefined : path.join(configDir, match);
    } catch {
      return undefined;
    }
  }

  private declaresEnabledAiModel(configPath: string): boolean {
    let config: CfsConfigProjects;
    try {
      config = JSON.parse(
        readFileSync(configPath, "utf-8"),
      ) as CfsConfigProjects;
    } catch (error) {
      // A workspace always generates a parseable .cfsconfig, so a malformed one
      // is a real defect. Swallowing it here would re-mask exactly the class of
      // gap this method exists to close.
      throw new Error(
        `Failed to read or parse ${configPath}: ${(error as Error).message}`,
      );
    }

    return (config.Projects ?? []).some((project) =>
      (project.AIModels ?? []).some(
        (model) => String(model.Enabled).toLowerCase() !== "false",
      ),
    );
  }

  private ensureTflmModules(workspaceDir: string, projectPath: string): void {
    if (!this.projectUsesTflm(projectPath)) {
      return;
    }

    console.log(`[tflm:west] ${path.basename(projectPath)} needs TFLM modules`);
    const sdkDirs = this.resolveTflmSdkDirs(workspaceDir);
    if (sdkDirs.length === 0) {
      console.log(
        "[tflm:west] no ADI Zephyr SDK installed for this workspace; leaving it as is",
      );
      return;
    }

    const west = this.resolveWestCommand();
    for (const topdir of sdkDirs) {
      this.allowlistTflmModules(
        path.join(topdir, "adi-zephyr-sdk", "west.yml"),
      );
      if (!existsSync(path.join(topdir, ".west", "config"))) {
        this.runWest(west, topdir, ["init", "-l", "adi-zephyr-sdk"]);
      }

      const merged = this.mergeProjectFilter(
        this.readWestConfig(west, topdir, "manifest.project-filter"),
      );
      this.runWest(west, topdir, [
        "config",
        "manifest.project-filter",
        "--",
        merged,
      ]);

      if (this.tflmModulesPresent(topdir)) {
        console.log(`[tflm:west] ${topdir} already prepared; skipping fetch`);
        continue;
      }
      console.log(`[tflm:west] preparing ${topdir}`);
      this.runWest(west, topdir, ["update", "--group-filter=-adi"]);
      console.log(`[tflm:west] ready ${topdir}`);
    }
  }

  private resolveTflmSdkDirs(workspaceDir: string): string[] {
    const dirs = new Set<string>();
    const index = readPackageIndex();
    for (const pkg of this.readDeclaredPackages(workspaceDir)) {
      if (!(pkg.name in index)) {
        continue;
      }
      // The index records the conan package folder (.../<hash>/p); the west
      // workspace the build uses is its sibling .../<hash>/f.
      const topdir = path.join(path.dirname(index[pkg.name].path), "f");
      if (existsSync(path.join(topdir, "adi-zephyr-sdk", "west.yml"))) {
        dirs.add(topdir);
      }
    }
    return [...dirs];
  }

  private readDeclaredPackages(workspaceDir: string): DeclaredPackage[] {
    try {
      const manifestPath = path.join(workspaceDir, ".cfs", ".cfsdependencies");
      const manifest = JSON.parse(readFileSync(manifestPath, "utf-8")) as {
        packages?: DeclaredPackage[];
      };
      return manifest.packages ?? [];
    } catch {
      return [];
    }
  }

  private tflmModulesPresent(topdir: string): boolean {
    return TFLM_WEST_MODULES.every((name) =>
      [
        path.join(topdir, "modules", "lib", name),
        path.join(topdir, "optional", "modules", "lib", name),
      ].some((dir) => existsSync(path.join(dir, ".git"))),
    );
  }

  private projectUsesTflm(projectPath: string): boolean {
    const candidates = [
      path.join(projectPath, "prj.conf"),
      ...this.listConfFiles(path.join(projectPath, "boards")),
    ];

    return candidates.some((file) => {
      try {
        return readFileSync(file, "utf-8").includes(
          "CONFIG_TENSORFLOW_LITE_MICRO=y",
        );
      } catch {
        return false;
      }
    });
  }

  private listConfFiles(dir: string): string[] {
    try {
      return readdirSync(dir)
        .filter((entry) => entry.endsWith(".conf"))
        .map((entry) => path.join(dir, entry));
    } catch {
      return [];
    }
  }

  private allowlistTflmModules(manifestPath: string): void {
    let manifest: string;
    try {
      manifest = readFileSync(manifestPath, "utf-8");
    } catch {
      return;
    }

    const anchorPattern = /^([ \t]*)name-allowlist:[ \t]*\r?\n/m;
    const anchor = anchorPattern.exec(manifest);
    if (anchor === null) {
      return;
    }

    const blockStart = anchor.index + anchor[0].length;
    const itemPattern = /^([ \t]*)-[ \t]*(\S+)[ \t]*\r?\n/;
    let cursor = blockStart;
    let itemIndent: string | null = null;
    const listed = new Set<string>();

    for (;;) {
      const line = itemPattern.exec(manifest.slice(cursor));
      if (line === null || line.index !== 0) {
        break;
      }
      if (itemIndent === null) {
        itemIndent = line[1];
      } else if (line[1] !== itemIndent) {
        break;
      }
      listed.add(line[2]);
      cursor += line[0].length;
    }

    const missing = TFLM_WEST_MODULES.filter((name) => !listed.has(name));
    if (missing.length === 0 || itemIndent === null) {
      return;
    }

    const eol = manifest.includes("\r\n") ? "\r\n" : "\n";
    const addition = missing
      .map((name) => `${itemIndent}- ${name}${eol}`)
      .join("");
    writeFileSync(
      manifestPath,
      manifest.slice(0, cursor) + addition + manifest.slice(cursor),
      "utf-8",
    );
    console.log(`[tflm:west] allowlisted ${missing.join(", ")}`);
  }

  private resolveWestCommand(): string {
    const override = process.env.CFS_WEST_CMD;
    if (override) {
      return override;
    }

    const installDir = process.env.CFS_INSTALL_DIR;
    if (installDir) {
      const bundled =
        process.platform === "win32"
          ? path.join(installDir, "Tools", "python", "Scripts", "west.exe")
          : path.join(installDir, "Tools", "python", "bin", "west");
      if (existsSync(bundled)) {
        return bundled;
      }
    }

    return "west";
  }

  private runWest(west: string, topdir: string, args: string[]): void {
    execFileSync(west, args, {
      cwd: topdir,
      stdio: "inherit",
      timeout: WEST_TIMEOUT_MS,
      shell: process.platform === "win32",
    });
  }

  private readWestConfig(west: string, topdir: string, key: string): string {
    try {
      return execFileSync(west, ["config", key], {
        cwd: topdir,
        timeout: WEST_TIMEOUT_MS,
        shell: process.platform === "win32",
        encoding: "utf-8",
      }).trim();
    } catch {
      return "";
    }
  }

  private mergeProjectFilter(current: string): string {
    const kept = current
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .filter(
        (entry) => !TFLM_WEST_MODULES.includes(entry.replace(/^[+-]/, "")),
      );
    const additions = TFLM_WEST_MODULES.map((name) => `+${name}`);
    return [...kept, ...additions].join(",");
  }

  private reconcileDependencies(cfsUtil: string, workspaceDir: string): void {
    const manifestPath = path.join(workspaceDir, ".cfs", ".cfsdependencies");
    let declared: DeclaredPackage[];
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, "utf-8")) as {
        packages?: DeclaredPackage[];
      };
      declared = manifest.packages ?? [];
    } catch (error) {
      // The build test reconciles against the workspace's generated
      // `.cfsdependencies`; a missing or malformed manifest is a real defect,
      // not a reason to skip reconciliation and build against cached packages.
      throw new Error(
        `Failed to read or parse ${manifestPath}: ${(error as Error).message}`,
      );
    }

    const declaredByName = new Map(
      declared.map((pkg) => [pkg.name, pkg.version]),
    );

    this.removeStalePackages(cfsUtil, declaredByName);

    const remaining = new Map(
      this.listInstalledPackages(cfsUtil).map((pkg) => [pkg.name, pkg.version]),
    );
    const missing = declared.filter((pkg) => {
      const installedVersion = remaining.get(pkg.name);
      return (
        installedVersion === undefined ||
        !this.versionSatisfies(installedVersion, pkg.version)
      );
    });
    if (missing.length === 0) {
      return;
    }

    for (const pkg of missing) {
      console.log(`[deps:install] ${pkg.name}/${pkg.version}`);
    }

    this.runPackageCommand(cfsUtil, [
      "pkg",
      "install",
      manifestPath,
      "--acceptLicense",
    ]);
  }

  private removeStalePackages(
    cfsUtil: string,
    declaredByName: Map<string, string>,
  ): void {
    const skipLogged = new Set<string>();
    for (;;) {
      let removedAny = false;
      for (const pkg of this.listInstalledPackages(cfsUtil)) {
        const declaredVersion = declaredByName.get(pkg.name);
        if (
          declaredVersion !== undefined &&
          this.versionSatisfies(pkg.version, declaredVersion)
        ) {
          continue;
        }
        if (this.tryUninstallPackage(cfsUtil, pkg.name)) {
          console.log(`[deps:remove] ${pkg.name}/${pkg.version}`);
          removedAny = true;
        } else if (!skipLogged.has(pkg.name)) {
          skipLogged.add(pkg.name);
          console.log(
            `[deps:remove-skip] ${pkg.name}/${pkg.version} (required by another package)`,
          );
        }
      }
      if (!removedAny) {
        break;
      }
    }
  }

  private versionSatisfies(installedVersion: string, spec: string): boolean {
    if (semver.valid(installedVersion) === null) {
      return false;
    }
    if (semver.valid(spec) !== null) {
      return semver.eq(installedVersion, spec);
    }
    if (semver.validRange(spec) !== null) {
      return semver.satisfies(installedVersion, spec);
    }
    return false;
  }

  private listInstalledPackages(cfsUtil: string): DeclaredPackage[] {
    const output = execFileSync(cfsUtil, ["pkg", "list"], {
      timeout: PKG_TIMEOUT_MS,
      shell: process.platform === "win32",
      encoding: "utf-8",
    });
    return output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.startsWith("- "))
      .map((line) => line.slice(2).trim())
      .filter(Boolean)
      .map((reference) => {
        const separator = reference.lastIndexOf("/");
        return separator === -1
          ? { name: reference, version: "" }
          : {
              name: reference.slice(0, separator),
              version: reference.slice(separator + 1),
            };
      });
  }

  private runPackageCommand(cfsUtil: string, args: string[]): void {
    execFileSync(cfsUtil, args, {
      stdio: "inherit",
      timeout: PKG_TIMEOUT_MS,
      shell: process.platform === "win32",
    });
  }

  private tryUninstallPackage(cfsUtil: string, name: string): boolean {
    try {
      execFileSync(cfsUtil, ["pkg", "uninstall", name], {
        stdio: "pipe",
        timeout: PKG_TIMEOUT_MS,
        shell: process.platform === "win32",
      });
      return true;
    } catch (error) {
      const status = (error as { status?: number | null }).status;
      if (typeof status === "number") {
        return false;
      }
      throw error;
    }
  }
}
