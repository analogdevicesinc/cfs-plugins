import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import fg from "fast-glob";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import copy from "rollup-plugin-copy";
import { existsSync, lstatSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const getTopLevelDir = (globPath) => {
  const normalizedPath = globPath.replace(/^[.][/]/, "");
  const firstSlashIdx = normalizedPath.indexOf("/");

  return firstSlashIdx === -1
    ? normalizedPath
    : normalizedPath.slice(0, firstSlashIdx);
};

const config = async () => {
  const files = await fg.glob("./**/*.ts", {
    ignore: ["./**/dist/**", "./**/*.test.ts"],
    cwd: __dirname
  });

  // Get all plugin directories (those with .cfsplugin files)
  let pluginDirs = await fg.glob("./*/.cfsplugin", {
    cwd: __dirname
  });
  // Convert .cfsplugin paths to directory names
  pluginDirs = pluginDirs.map((file) => getTopLevelDir(file));

  const configs = [];

  // Process TypeScript files
  configs.push(
    ...files.map((file) => {
      const dir = getTopLevelDir(file);
      const dirAbsolutePath = resolve(__dirname, dir);

      const isDirectory =
        existsSync(dirAbsolutePath) &&
        lstatSync(dirAbsolutePath).isDirectory();

      const copyTargets = [
        {
          src: [`${dir}/**`, `!${dir}/**/*.ts`],
          dest: `dist/${dir}`
        },
        {
          src: ["common/gdb_toolbox/**"],
          dest: `dist/${dir}/files/` // Copy gdb_toolbox into files
        }
      ];

      const copyPlugin = isDirectory
        ? copy({
            targets: copyTargets,
            dot: true,
            flatten: false,
            onlyFiles: true
          })
        : null;

      return {
        input: file,
        output: {
          dir: "dist",
          entryFileNames: file.replace(/\.ts$/, ".cjs"),
          format: "commonjs",
          sourcemap: true,
          exports: "auto"
        },
        plugins: [
          nodeResolve({
            extensions: [".ts", ".js"],
            preferBuiltins: true
          }),
          commonjs({
            extensions: [".js", ".ts"]
          }),
          typescript({
            tsconfig: "./tsconfig.json",
            outDir: "dist",
            rootDir: "."
          }),
          ...(copyPlugin ? [copyPlugin] : [])
        ],
        external: [
          "eta",
          "path",
          "fs",
          "url",
          /node_modules[\\/](?!cfs-plugins-sdk(?:[\\/]|$))/
        ],
        onwarn(warning, warn) {
          throw new Error(warning.message);
        }
      };
    })
  );

  // Process plugin directories without TypeScript files
  const processedDirs = new Set(
    files.map((file) => getTopLevelDir(file))
  );

  pluginDirs.forEach((dir) => {
    if (!processedDirs.has(dir)) {
      configs.push({
        input: "virtual:empty",
        output: { dir: "dist", format: "es" },
        plugins: [
          {
            name: "virtual-empty",
            resolveId(id) {
              if (id === "virtual:empty") return id;
            },
            load(id) {
              if (id === "virtual:empty") return "export {}";
            }
          },
          copy({
            targets: [
              { src: [`${dir}/**`], dest: `dist/${dir}` },
              {
                src: ["common/gdb_toolbox/**"],
                dest: `dist/${dir}/files`
              }
            ],
            dot: true,
            flatten: false,
            onlyFiles: true
          })
        ],
        external: () => true
      });
    }
  });

  return configs;
};

export default config;
