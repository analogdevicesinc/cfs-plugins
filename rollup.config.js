import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { glob } from 'glob';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const config = async () => {
  const files = await glob('plugins/**/*.ts', {
    ignore: ['plugins/**/dist/**', 'plugins/**/*.test.ts'],
    cwd: __dirname
  });

  return files.map(file => ({
    input: file,
    output: {
      file: file.replace(/\.ts$/, '.cjs'),
      format: 'commonjs',
      sourcemap: true,
      exports: 'auto'
    },
    plugins: [
      nodeResolve({
        extensions: ['.ts', '.js'],
        preferBuiltins: true
      }),
      commonjs({
        extensions: ['.js', '.ts'],
        ignore: ['conditional-runtime-dependency']
      }),
      typescript({
        tsconfig: './',

      })
    ],
    external: [
      'eta',
      'path',
      'fs',
      'url',
      /node_modules/
    ]
  }));
};

export default config;
