const resolve = require('rollup-plugin-node-resolve')
const commonjs = require('rollup-plugin-commonjs')
const {resolve: resolvePath, join} = require('path')
const alias = require('rollup-plugin-alias')
const json = require('rollup-plugin-json')
const sourcemaps = require('rollup-plugin-sourcemaps')
const multientry = require('rollup-plugin-multi-entry')

module.exports = function createConfig({base, paths}) {
  return [
    {
      input: {
        include: [join(base, 'dist/**/*.test.js')],
        exclude: [join(base, 'dist/**/*.mem.test.js')],
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
    {
      input: {
        'parse-releases.cli.bundle': resolvePath(
          base,
          'dist/parse-releases.cli.js',
        ),
        'find-by-barcode.cli.bundle': resolvePath(
          base,
          'dist/find-by-barcode.cli.js',
        ),
      },

      output: {
        dir: resolvePath(base, 'bundle'),
        entryFileNames: '[name].js',
        format: 'commonjs',
        sourcemap: true,
      },

      plugins: [
        sourcemaps(),
        alias(paths),
        resolve({
          browser: false,
          customResolveOptions: {
            moduleDirectory: ['node_modules'],
          },
        }),
        commonjs(),
        json(),
      ],
    },
  ]
}
