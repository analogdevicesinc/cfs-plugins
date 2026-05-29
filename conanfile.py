from pathlib import Path
from conan import ConanFile
from conan.tools import files
import os
import json

def _iter_plugin_files():
    plugins_dir = Path(__file__).parent / 'plugins'
    for plugin_file in plugins_dir.rglob('.cfsplugin'):
        if 'dist' not in plugin_file.parts:
            yield plugin_file


def _get_cfs_components():
    components = []
    for plugin_file in sorted(_iter_plugin_files()):
        with open(plugin_file) as f:
            data = json.load(f)
        plugin_id = data.get('pluginId')
        plugin_version = data.get('pluginVersion')
        if plugin_id:
            components.append({'name': plugin_id, 'version': plugin_version, 'type': 'plugin'})
    return components


def _get_cfs_soc():
    socs = set()
    for plugin_file in _iter_plugin_files():
        with open(plugin_file) as f:
            data = json.load(f)
        for soc in data.get('supportedSocs', []):
            name = soc.get('name')
            if name:
                socs.add(name)
    return tuple(sorted(socs))


class BasicConanfile(ConanFile):
    name = "cfs_base_plugins"
    description = "CFS plugins for MAX32XXX, MAX78XXX and SHARC-FX families"
    license = "Apache-2.0"
    package_id_unknown_mode = "unrelated_mode"
    cfs_version = "^2.0"
    cfs_pkg_type = "plugin"

    exports = "package.json"

    def init(self):
        self.cfs_soc = self.conan_data.get("cfs_soc")
        self.cfs_components = self.conan_data.get("cfs_components")

    def export(self):
        # Update conandata.yml with the list of components and socs computed
        # dynamically here. This information will be stored statically into
        # conandata.yml and is read later on by the init() method
        conandata = {
            "cfs_components": _get_cfs_components(),
            "cfs_soc": _get_cfs_soc()
        }
        files.update_conandata(self, conandata)

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
                          '*.rollup.cache', 'tests/unit-tests/*/data', 'tsconfig.tsbuildinfo', '.yarn/*', '.git', '.git/*',
                          'conandata.yml']
        files.copy(self, "*", self.recipe_folder, self.export_sources_folder, excludes=excluded_files)
        files.copy(self, ".yarn/releases/*", self.recipe_folder, self.export_sources_folder)

    def build(self):
        # Assuming yarn is available for the moment. Maybe we can have a build_requires later on
        self.run("yarn install --immutable --network-timeout 600000")
        self.run("yarn build")

    def package(self):
        files.copy(self, "*", f'{self.source_folder}/plugins/dist/', self.package_folder, excludes=['tsconfig.tsbuildinfo'])

        files.copy(self, "node_modules/*", self.source_folder, self.package_folder)
        files.copy(self, "LICENSE", self.source_folder, self.package_folder)
