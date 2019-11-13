import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import json from '@rollup/plugin-json';

export default {
  input: 'src/server.js',
  output: {
    file: './build/index.js',
    format: 'cjs',
  },
  plugins: [
    resolve({
      preferBuiltins: true,
    }),
    commonjs(),
    json(),
    babel({
      exclude: 'node_modules/**',
    }),
  ],
};
