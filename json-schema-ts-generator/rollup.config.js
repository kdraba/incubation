const resolve = require('rollup-plugin-node-resolve')
const commonjs = require('rollup-plugin-commonjs')
const {resolve: resolvePath, join} = require('path')
const alias = require('rollup-plugin-alias')
const sourcemaps = require('rollup-plugin-sourcemaps')
const multientry = require('rollup-plugin-multi-entry')
const istanbul = require('rollup-plugin-istanbul')

module.exports = function createConfig({base, paths}) {
  return [
    {
      input: {
        include: [join(base, 'dist/**/*.test.js')],
      },

      output: {
        //dir: resolvePath(base, 'bundle'),
        //entryFileNames: 'bundle.test.js',
        name: 'Dummy',
        file: resolvePath(base, 'bundle', 'test.bundle.js'),
        format: 'cjs',
        sourcemap: true,
        sourcemapFile: resolvePath(base, 'bundle', 'test.bundle.js.map'),
      },

      plugins: [
        sourcemaps(),
        alias(paths),
        multientry(),
        resolve({
          browser: false,
          customResolveOptions: {
            moduleDirectory: ['node_modules'],
          },
        }),
        commonjs({sourceMap: true}),
        //istanbul({sourceMap: true})
        //istanbul({exclude: ['dist/**/*.test.js']})
      ],
    },
  ]
}
