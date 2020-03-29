import test from 'tape'

import {createArrayBufferStrategy} from '../../iterator/array-buffer-strategy'
import {PushableIterator} from '../../iterator/pushable-iterator'
import {asyncSource, source} from '../../pipe'
import {last} from '../finite'
import {take} from '../terminal/take'
import {prefetch} from './prefetch'
import {tap} from './tap'

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

test('prefetch: mem test', async (t) => {
  t.plan(1)
  const prefetchCount = 10
  const pushIt = new PushableIterator(createArrayBufferStrategy())

  let initial: ReturnType<typeof process['memoryUsage']> | undefined
  const size = 1 * 1024 * 1024
  let counter = 0
  const count = 100

  const it = source(values(count, size)).pipe(
    tap((_, index) => {
      pushIt.push(index)
      counter = index
    }),
  )

  const resultIt = source(it)
    .pipe(prefetch(prefetchCount))
    [Symbol.asyncIterator]()

  let done = false
  let isFirst = true

  while (!done) {
    const result = await resultIt.next()
    done = !!result.done

    if (isFirst) {
      // fill prefetch buffer
      await asyncSource({[Symbol.asyncIterator]: () => pushIt})
        .pipe(take(prefetchCount))
        .pipe(last())
        [Symbol.asyncIterator]()
        .next()

      global.gc()
      initial = process.memoryUsage()

      t.comment('initial prefetch buffer filled')

      isFirst = false
    } else if (counter < count - 1) {
      await pushIt.next()
    }

    if (initial) {
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
    } else {
      t.fail('no initial memory data')
    }
  }
})
