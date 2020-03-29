declare module '@ardatan/node-memwatch' {
  class HeapDiff {
    end(): {}
  }

  //interface Memwatch {
  function on(event: 'stats', cb: (stats: {}) => void): void
  function gc(): void
  //}

  // exports.default = Memwatch
}
