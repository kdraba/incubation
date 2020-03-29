import test from 'tape'

import {fork} from './fork'

function format(v: number) {
  return Math.round((v / 1024 / 1024) * 100) / 100
}

function* values(max: number, size: number) {
  let index = 0

  while (index < max) {
    yield Buffer.alloc(size, 'a')
    index++
  }
}

test('fork: mem test', async (t) => {
  t.plan(1)

  global.gc()
  const initial = process.memoryUsage()
  const size = 1 * 1024 * 1024

  const it = values(100, size)

  const forks = fork(it, [(v) => v, (v) => v])

  let done = false

  while (!done) {
    done = true
    for (const f of forks) {
      const result = await f.next()
      done = done && !!result.done
    }

    global.gc()
    const used = process.memoryUsage()

    const diffExternal = used.external - initial.external
    const diffHeapUsed = used.heapUsed - initial.heapUsed

    if (diffExternal > 2 * size || diffHeapUsed > 2 * size) {
      t.fail(
        `diffs: heapUsed=${format(diffHeapUsed)} external=${format(
          diffExternal,
        )} vs 2 * ${format(size)}`,
      )
      done = true
    } else if (done) {
      t.pass('success')
    }
  }
})
