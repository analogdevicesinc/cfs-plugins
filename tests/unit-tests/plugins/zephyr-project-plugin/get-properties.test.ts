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

import os from "node:os";
import { expect } from "chai";
import sinon from "sinon";
import type {
  CfsFeatureScope,
  CfsPluginInfo,
  CfsPluginProperty,
} from "cfs-types";
import ZephyrProjectPlugin from "@plugins/zephyr-project-plugin/index.js";
import { getZephyrBoardName } from "@plugins/zephyr-project-plugin/services/property-provider.js";
import { loadPluginInfoSync } from "@utilities/test-utilities.js";

// Project-plugin manifest, read from the built `plugins/dist/` output.
const PROJECT_MANIFEST = "plugins/dist/zephyr-project-plugin/.cfsplugin";

// A real SoC that ships core-dump support (drives an EnableCoreDump property).
const CORE_DUMP_SOC = "MAX32690";

// The BuildSystem options the manifest ships, in manifest order, and the one
// the plugin drops on Windows (Make is not available in the Windows toolchain).
const MANIFEST_BUILD_SYSTEMS = ["ninja", "make"];
const WIN32_FILTERED_BUILD_SYSTEM = "make";

// The ZephyrVersion options the manifest ships, in order, and its default.
const MANIFEST_ZEPHYR_VERSIONS = ["4.2.0", "4.3.0", "4.4.2"];
const MANIFEST_ZEPHYR_DEFAULT = "4.4.2";
// max32657/max32658 make a specific Zephyr the default and append it to the option
// list (see property-provider getProperties), but only when a board is supplied.
const MAX3265X_ZEPHYR_VERSION = "4.4.0";
const MAX3265X_SOCS = ["max32657", "max32658"];

/** The BuildSystem option values in a property list, in order. */
function buildSystemValues(properties: CfsPluginProperty[]): string[] {
  const buildSystem = properties.find((prop) => prop.id === "BuildSystem");
  return (buildSystem?.enum ?? []).map((option) => option.value);
}

/** The ZephyrVersion property in a property list, if present. */
function zephyrVersionProp(
  properties: CfsPluginProperty[],
): CfsPluginProperty | undefined {
  return properties.find((prop) => prop.id === "ZephyrVersion");
}

/** The ZephyrVersion option values in a property list, in order. */
function zephyrVersionValues(properties: CfsPluginProperty[]): string[] {
  return (zephyrVersionProp(properties)?.enum ?? []).map(
    (option) => option.value,
  );
}

/** The project-scope properties a manifest ships (empty if it declares none). */
function projectProperties(info: CfsPluginInfo): CfsPluginProperty[] {
  return info.properties?.project ?? [];
}

describe("Zephyr project plugin - getProperties", () => {
  const projectPluginInfo: CfsPluginInfo = loadPluginInfoSync(PROJECT_MANIFEST);
  let projectPlugin: ZephyrProjectPlugin;

  beforeEach(() => {
    projectPlugin = new ZephyrProjectPlugin(projectPluginInfo);
  });

  // A known scope returns an array; an unknown scope returns an empty array.
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

  // Zephyr-specific getProperties behavior: platform-dependent build systems,
  // SoC-gated EnableCoreDump, and firmware-derived Zephyr board names.
  //
  // BuildSystem filtering is keyed off os.platform(), so the host platform is
  // stubbed rather than read. Deriving the expectation from the real host would
  // only ever exercise whichever branch that runner happens to be, leaving the
  // other one unverified on every OS in the CI matrix.
  describe("filters the BuildSystem options by host platform", () => {
    afterEach(() => {
      sinon.restore();
    });

    /**
     * `getProperties` for a stubbed host platform. The manifest is loaded fresh
     * per call because the plugin filters the property's `enum` in place (see
     * the in-place test below); sharing one manifest would leak the win32 case's
     * removal into every case that ran after it.
     */
    function getPropertiesOn(platform: NodeJS.Platform) {
      sinon.stub(os, "platform").returns(platform);
      const pluginInfo = loadPluginInfoSync(PROJECT_MANIFEST);
      const result = new ZephyrProjectPlugin(pluginInfo).getProperties(
        "project",
        { soc: CORE_DUMP_SOC },
      );
      return { pluginInfo, result };
    }

    it("ships a build system for the win32 branch to remove", () => {
      // Without this, the win32 case below would still pass if the manifest
      // stopped shipping `make` at all, hiding a dead filter.
      const shipped = buildSystemValues(
        projectProperties(loadPluginInfoSync(PROJECT_MANIFEST)),
      );
      expect(shipped).to.deep.equal(MANIFEST_BUILD_SYSTEMS);
      expect(shipped).to.include(WIN32_FILTERED_BUILD_SYSTEM);
    });

    it("removes make on win32", () => {
      const { result } = getPropertiesOn("win32");
      expect(buildSystemValues(result)).to.deep.equal(
        MANIFEST_BUILD_SYSTEMS.filter(
          (value) => value !== WIN32_FILTERED_BUILD_SYSTEM,
        ),
      );
    });

    it("keeps every option on linux", () => {
      const { result } = getPropertiesOn("linux");
      expect(buildSystemValues(result)).to.deep.equal(MANIFEST_BUILD_SYSTEMS);
    });

    it("keeps every option on darwin", () => {
      const { result } = getPropertiesOn("darwin");
      expect(buildSystemValues(result)).to.deep.equal(MANIFEST_BUILD_SYSTEMS);
    });

    it("removes make only once across repeated win32 calls", () => {
      // The filter splices by index, so a second pass must find nothing to
      // remove rather than dropping the next option along (ninja).
      sinon.stub(os, "platform").returns("win32");
      const plugin = new ZephyrProjectPlugin(
        loadPluginInfoSync(PROJECT_MANIFEST),
      );
      const context = { soc: CORE_DUMP_SOC };
      const expected = MANIFEST_BUILD_SYSTEMS.filter(
        (value) => value !== WIN32_FILTERED_BUILD_SYSTEM,
      );

      expect(
        buildSystemValues(plugin.getProperties("project", context)),
      ).to.deep.equal(expected);
      expect(
        buildSystemValues(plugin.getProperties("project", context)),
      ).to.deep.equal(expected);
    });

    it("filters the caller's manifest in place on win32", () => {
      // Documents current behavior rather than asserting the manifest is
      // untouched: the property objects are copied, but their `enum` arrays are
      // the manifest's own arrays, and the filter splices one of them. Callers
      // that reuse a CfsPluginInfo across platforms would see the filtered list.
      // If the provider is ever changed to copy the enum before filtering, this
      // test should flip to asserting the manifest is unchanged.
      const { pluginInfo } = getPropertiesOn("win32");
      expect(
        buildSystemValues(projectProperties(pluginInfo)),
        "the loaded manifest is mutated by the win32 filter",
      ).to.not.include(WIN32_FILTERED_BUILD_SYSTEM);
    });
  });

  it("includes the EnableCoreDump property for MAX32690", () => {
    const result = projectPlugin.getProperties("project", {
      soc: CORE_DUMP_SOC,
    });

    const enableCoreDumpProp = result.find(
      (prop) => prop.id === "EnableCoreDump",
    );
    expect(enableCoreDumpProp).to.exist;
  });

  it("omits EnableCoreDump for a SoC without core-dump support", () => {
    const result = projectPlugin.getProperties("project", {
      soc: "max00000",
    });

    const enableCoreDumpProp = result.find(
      (prop) => prop.id === "EnableCoreDump",
    );
    expect(enableCoreDumpProp).to.be.undefined;
  });

  it("omits EnableCoreDump when no context is passed", () => {
    const result = projectPlugin.getProperties("project");

    const enableCoreDumpProp = result.find(
      (prop) => prop.id === "EnableCoreDump",
    );
    expect(enableCoreDumpProp).to.be.undefined;
  });

  it("omits EnableCoreDump when the context has no soc key", () => {
    const result = projectPlugin.getProperties("project", {
      someKey: "some-value",
    });

    const enableCoreDumpProp = result.find(
      (prop) => prop.id === "EnableCoreDump",
    );
    expect(enableCoreDumpProp).to.be.undefined;
  });

  it("derives the ZephyrBoardName default from the firmware board/soc", () => {
    const result = projectPlugin.getProperties("project", {
      boardId: "evkit_v1",
      soc: "max32690",
    });

    const boardNameProp = result.find((prop) => prop.id === "ZephyrBoardName");
    expect(boardNameProp).to.exist;
    expect(boardNameProp?.default).to.eq("max32690evkit/max32690/m4");
  });

  it("appends the /rv32 suffix when the coreId starts with RV (RV32)", () => {
    const result = getZephyrBoardName(
      "evkit_v1",
      "max32690",
      undefined,
      "RV32",
    );
    expect(result).to.eq("max32690evkit/max32690/rv32");
  });

  it("appends the /rv32 suffix for any coreId starting with RV", () => {
    const result = getZephyrBoardName(
      "AD-APARD32690-SL",
      "max32690",
      undefined,
      "RV",
    );
    expect(result).to.eq("apard32690/max32690/rv32");
  });

  // The max32657/max32658 branch in getProperties makes a newer Zephyr the
  // ZephyrVersion default and appends it to the option list, but only when both
  // a board and one of those SoCs are supplied. The cases assert that behavior
  // structurally - exactly one version appended beyond the manifest baseline,
  // which becomes the default - so a routine version bump touches only the
  // MAX3265X_ZEPHYR_VERSION change-detector rather than every assertion. Each
  // case loads a fresh manifest because the branch pushes onto the property's
  // `enum` in place (the same shared-array behavior the BuildSystem in-place
  // test documents); reusing one manifest would leak the appended version into
  // every case that ran after it.
  describe("appends a max3265x-specific Zephyr version for max32657/max32658", () => {
    function getPropertiesFor(context: Record<string, unknown>) {
      return new ZephyrProjectPlugin(
        loadPluginInfoSync(PROJECT_MANIFEST),
      ).getProperties("project", context);
    }

    // The ZephyrVersion options the manifest ships, read fresh so the cases
    // track the manifest rather than a second hardcoded copy of it.
    function shippedZephyrVersions(): string[] {
      return zephyrVersionValues(
        projectProperties(loadPluginInfoSync(PROJECT_MANIFEST)),
      );
    }

    it("ships the manifest baseline without the version the branch adds", () => {
      // Drift guard, and the one case that pins the manifest baseline: if the
      // manifest already shipped MAX3265X_ZEPHYR_VERSION or defaulted to it, the
      // behavioral cases below would pass without the branch running. A manifest
      // bump then fails here deliberately rather than silently.
      const shipped = projectProperties(loadPluginInfoSync(PROJECT_MANIFEST));
      expect(zephyrVersionProp(shipped)?.default).to.equal(
        MANIFEST_ZEPHYR_DEFAULT,
      );
      expect(zephyrVersionValues(shipped)).to.deep.equal(
        MANIFEST_ZEPHYR_VERSIONS,
      );
      expect(zephyrVersionValues(shipped)).to.not.include(
        MAX3265X_ZEPHYR_VERSION,
      );
    });

    MAX3265X_SOCS.forEach((soc) => {
      it(`appends a new default version for ${soc}`, () => {
        const result = getPropertiesFor({ boardId: "evkit_v1", soc });
        const newDefault = zephyrVersionProp(result)?.default;

        // Behavioral invariants, independent of the exact version string:
        // exactly one version is appended beyond the manifest baseline, and it
        // becomes the default (so it differs from the shipped default).
        expect(zephyrVersionValues(result)).to.deep.equal([
          ...shippedZephyrVersions(),
          newDefault,
        ]);
        expect(newDefault).to.not.equal(MANIFEST_ZEPHYR_DEFAULT);

        // The single change-detector for the specific version: update this one
        // constant when the plugin adopts a newer max3265x Zephyr version.
        expect(newDefault).to.equal(MAX3265X_ZEPHYR_VERSION);
      });
    });

    it("leaves ZephyrVersion untouched for a non-max3265x SoC", () => {
      const result = getPropertiesFor({ boardId: "evkit_v1", soc: "max32690" });
      expect(zephyrVersionProp(result)?.default).to.equal(
        MANIFEST_ZEPHYR_DEFAULT,
      );
      expect(zephyrVersionValues(result)).to.deep.equal(
        shippedZephyrVersions(),
      );
    });

    it("requires a board: soc alone leaves ZephyrVersion untouched", () => {
      // The bump is gated on `boardId && soc`; a bare soc must not trigger it.
      const result = getPropertiesFor({ soc: "max32657" });
      expect(zephyrVersionProp(result)?.default).to.equal(
        MANIFEST_ZEPHYR_DEFAULT,
      );
      expect(zephyrVersionValues(result)).to.deep.equal(
        shippedZephyrVersions(),
      );
    });
  });

  // Manifest drift guard: every supported SoC must flow through getProperties and
  // receive the unconditional project properties, and EnableCoreDump must remain
  // the only SoC-gated property. A new SoC or a new conditional property then
  // fails here instead of silently escaping the hardcoded cases above.
  describe("covers every supported SoC (manifest drift guard)", () => {
    it("returns the unconditional project properties for every supported SoC and exercises both EnableCoreDump branches", () => {
      const unconditionalIds = projectProperties(projectPluginInfo)
        .filter((prop) => !prop.condition)
        .map((prop) => prop.id);

      let withCoreDump = 0;
      let withoutCoreDump = 0;

      for (const supportedSoc of projectPluginInfo.supportedSocs) {
        const ids = projectPlugin
          .getProperties("project", { soc: supportedSoc.name })
          .map((prop) => prop.id);

        for (const id of unconditionalIds) {
          expect(
            ids,
            `${id} should be present for ${supportedSoc.name}`,
          ).to.include(id);
        }

        if (ids.includes("EnableCoreDump")) {
          withCoreDump++;
        } else {
          withoutCoreDump++;
        }
      }

      // Both EnableCoreDump branches must occur in the real supported set, so the
      // present/absent cases above reflect shipped SoCs rather than hypotheticals.
      expect(
        withCoreDump,
        "a supported SoC should enable core dump",
      ).to.be.greaterThan(0);
      expect(
        withoutCoreDump,
        "a supported SoC should omit core dump",
      ).to.be.greaterThan(0);
    });

    it("keeps EnableCoreDump as the only SoC-gated project property", () => {
      // Adding another conditional project property must fail this guard until a
      // dedicated present/absent case is added for it above.
      const conditionalIds = projectProperties(projectPluginInfo)
        .filter((prop) => prop.condition)
        .map((prop) => prop.id);
      expect(conditionalIds).to.deep.equal(["EnableCoreDump"]);
    });
  });
});
