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

import { expect } from "chai";
import { CfsFsCopyFilesService } from "../../../plugins/common/services/cfs-fs-copy-files-service.js";
import path from "path";
import { isDebug } from "../utilities/test-utilities.js";

describe("Unit test for CfsFsCopyFilesService", () => {
  let data: { files: { src: string; dst: string }[] } = { files: [] };

  beforeEach(() => {
    data = {
      files: [
        {
          src: "files/src/**/*.c",
          dst: "src/",
        },
        {
          src: "files/**/*.md",
          dst: "/",
        },
        {
          src: "files/prj.conf",
          dst: "/",
        },
      ],
    };
  });

  afterEach(() => {
    if (!isDebug()) {
      // Check and delete the specific directory if it exists
      const directoryToDelete = "tests/unit-tests/services/data/copy-files";
      if (fs.existsSync(directoryToDelete)) {
        fs.rmSync(directoryToDelete, { recursive: true, force: true });
      }
    }
  });

  it("Should copy files from src to dst per .cfsplugin", async () => {
    const context = {
      location: path.resolve("tests/unit-tests/services/data/copy-files"),
    };

    const copyService = new CfsFsCopyFilesService(
      path.resolve("tests/unit-tests/services"),
      context
    );

    await copyService.copyFiles(data.files, context.location);

    const directoriesToCheck = [
      "tests/unit-tests/services/data/copy-files/src",
      "tests/unit-tests/services/data/copy-files",
    ];

    const filesToCheck = [
      { path: `${directoriesToCheck[0]}/main.c`, name: "main.c" },
      { path: `${directoriesToCheck[0]}/hello_world.c`, name: "hello_world.c" },
      { path: `${directoriesToCheck[0]}/blinky.c`, name: "blinky.c" },
      { path: `${directoriesToCheck[1]}/README.md`, name: "README.md" },
      { path: `${directoriesToCheck[1]}/prj.conf`, name: "prj.conf" },
    ];

    filesToCheck.forEach((file) => {
      try {
        const fileExists = fs.existsSync(file.path);
        expect(fileExists, `File ${file.name} does not exist at ${file.path}`)
          .to.be.true;
      } catch (error) {
        expect.fail(`${error}`);
      }
    });
  });
});
