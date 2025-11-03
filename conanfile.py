from pathlib import Path
from conan import ConanFile
from conan.tools import files
import os
import json

class BasicConanfile(ConanFile):
    name = "cfs_base_plugins"
    description = "CFS plugins for MAX32XXX, MAX78XXX and SHARC-FX families"
    license = "Apache-2.0"
    package_id_unknown_mode = "unrelated_mode"
    cfs_version = "^2.0"
    cfs_soc = (
        "MAX32650", "MAX32655", "MAX32657", "MAX32658",
        "MAX32660", "MAX32662", "MAX32666",
        "MAX32670", "MAX32672", "MAX32675C", "MAX32690",
        "MAX78000", "MAX78002",
        "ADSP-21834",  "ADSP-21835",  "ADSP-21836",  "ADSP-21837",
        "ADSP-21834W", "ADSP-21835W", "ADSP-21836W", "ADSP-21837W",
        "ADSP-SC834",  "ADSP-SC835",
        "ADSP-SC834W", "ADSP-SC835W"
    )
    cfs_pkg_type = "plugin"

    exports = "package.json"

    def set_version(self):
        if not self.version:
            recipe_folder = Path(self.recipe_folder)
            with open(recipe_folder / 'package.json') as pkg_json:
                self.version = json.load(pkg_json)['version']
            run_num = os.getenv('GITHUB_RUN_NUMBER')
            if run_num:
                self.version += '+' + run_num

    def export_sources(self):
        excluded_files = ['*/dist/*', '*/node_modules/*','dist/*', 'node_modules/*', '.github/*', '.vscode/*',
                          '*.rollup.cache', 'tests/unit-tests/*/data', 'tsconfig.tsbuildinfo', '.yarn/*', '.git', '.git/*']
        files.copy(self, "*", self.recipe_folder, self.export_sources_folder, excludes=excluded_files)
        files.copy(self, ".yarn/releases/*", self.recipe_folder, self.export_sources_folder)

    def build(self):
        # Assuming yarn is available for the moment. Maybe we can have a build_requires later on
        self.run("yarn install --immutable --network-timeout 600000")
        self.run("yarn build")

    def package(self):
        files.copy(self, "*", f'{self.source_folder}/plugins/dist/', self.package_folder, excludes=['tsconfig.tsbuildinfo'])

        # The exlusion of node_modules/cfs-plugins-api and later manual copy is because after build it is a symlink,
        # which is not resolved automatically
        #
        # Well, that is a good theory, but due to a bug on conan that symlink is not excluded:
        #   https://github.com/conan-io/conan/issues/18296
        # Keeping the code so it is ready once the bug is fixed, but implementing a temporary workaround on the following line
        files.symlinks.remove_external_symlinks(self, 'node_modules')
        files.copy(self, "node_modules/*", self.source_folder, self.package_folder, excludes=['node_modules/cfs-plugins-api'])
        files.copy(self, "*", f'{self.source_folder}/api/', f'{self.package_folder}/node_modules/cfs-plugins-api', excludes=['src'])
        files.copy(self, "LICENSE", self.source_folder, self.package_folder)
