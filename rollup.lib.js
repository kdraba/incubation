const resolve = require('@rollup/plugin-node-resolve').default
const commonjs = require('@rollup/plugin-commonjs')
const {resolve: resolvePath, join} = require('path')
const alias = require('@rollup/plugin-alias')
const sourcemaps = require('rollup-plugin-sourcemaps')
const multientry = require('@rollup/plugin-multi-entry')
//const istanbul = require('rollup-plugin-istanbul')
const babel = require('@rollup/plugin-babel').default

module.exports = {
  createTestBundle: ({name, input, base, paths}) => ({
    input,
    output: {
      //dir: resolvePath(base, 'bundle'),
      //entryFileNames: 'bundle.test.js',
      name: 'Dummy',
      file: resolvePath(base, 'bundle', `${name}.bundle.js`),
      format: 'cjs',
      sourcemap: true,
      sourcemapFile: resolvePath(base, 'bundle', `${name}.bundle.js.map`),
    },

    plugins: [
      sourcemaps(),
      alias({entries: paths}),
      multientry(),
      resolve({
        browser: false,
        customResolveOptions: {
          moduleDirectory: ['node_modules'],
        },
      }),
      commonjs({sourceMap: true}),
      babel({
        babelHelpers: 'runtime',
        plugins: [
          '@babel/plugin-transform-runtime',
          [
            'istanbul',
            {
              exclude: ['**/*.test.ts', 'node_modules/**/*'],
            },
          ],
        ],
        exclude: 'node_modules/**/*',
      }),
      //istanbul({sourceMap: true}),
      //istanbul({exclude: ['dist/**/*.test.js']})
    ],
  }),
}
