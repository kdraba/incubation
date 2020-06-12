const {join} = require('path')
const {createTestBundle} = require('../rollup.lib.js')

module.exports = function createConfig({base, paths}) {
  return [
    createTestBundle({
      name: 'test',
      input: {
        include: [join(base, 'dist/**/*.test.js')],
        exclude: [join(base, 'dist/**/*.mem.test.js')],
      },
      base,
      paths,
    }),
    createTestBundle({
      name: 'test.mem',
      input: {
        include: [join(base, 'dist/**/*.mem.test.js')],
      },
      base,
      paths,
    }),
  ]
}
