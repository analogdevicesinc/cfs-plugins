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
import * as fs from "fs";
import { CfsEtaTemplateService } from "../../../plugins/common/services/cfs-eta-template-service.js";
import { expect } from "chai";
import path from "path";
import { isDebug } from "../utilities/test-utilities.js";
import { CfsConfig } from "cfs-plugins-api";

describe("Unit test for CfsEtaTemplateService", () => {
  let data: { templates: { src: string; dst: string }[] } = { templates: [] };

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
        CoreId: "string",
        ProjectId: "string",
        PluginId: "string",
        PluginVersion: "string",
        FirmwarePlatform: "msdk",
        ExternallyManaged: true,
        Partitions: [{ Name: "Name" } as any],
        PlatformConfig: { Name: "Name" },
        Peripherals: [{ Name: "Name" } as any],
      },
    ],
  };

  beforeEach(() => {
    data = {
      templates: [
        {
          src: "templates/m4/**/*.eta",
          dst: "MAX32xxx/m4/",
        },
        {
          src: "templates/m4/**/*.eta",
          dst: "MAX32xxx/m4/",
        },
        {
          src: "templates/riscv/main.c.eta",
          dst: "MAX32xxx/riscv/",
        },
      ],
    };
  });

  afterEach(() => {
    if (!isDebug()) {
      const directoryToDelete = "tests/unit-tests/services/data";
      if (fs.existsSync(directoryToDelete)) {
        fs.rmSync(directoryToDelete, { recursive: true, force: true });
      }
    }
  });

  it("Should render templates per .cfsplugin", async () => {
    const context = {
      location: path.resolve("tests/unit-tests/services/data"),
    };

    const renderEtaTemplates = new CfsEtaTemplateService(
      path.resolve("tests/unit-tests/services"),
      context,
    );

    const templates = data.templates;

    await renderEtaTemplates.renderTemplates(
      templates,
      cfsConfig,
      context.location,
    );

    const directoriesToCheck = [
      "tests/unit-tests/services/data/MAX32xxx/m4",
      "tests/unit-tests/services/data/MAX32xxx/riscv",
    ];
    const fileName = "main.c";

    directoriesToCheck.forEach((dir) => {
      const filePath = `${dir}/${fileName}`;
      const fileExists = fs.existsSync(filePath);
      expect(fileExists, `${filePath} does not exist.`).to.be.true;
      const expectedContent = `#include <stdio.h>

int main(void) {
    printf("Hello, World!\\n");
    return 0;
}`;
      const dstContent = fs.readFileSync(filePath, "utf8");
      expect(expectedContent, `${expectedContent} does not exist.`).to.equal(
        dstContent,
      );
    });
  });
});
