import test from 'tape'

import {memTest} from '../mem-test'
import {createArrayBufferStrategy} from './array-buffer-strategy'
import {PushableIterator} from './pushable-iterator'

test('pushable-iterator/external mem', async (t) => {
  t.plan(1)

  const resultIt = new PushableIterator(createArrayBufferStrategy<any>())

  await memTest(
    (it) => ({
      next() {
        const next = it.next()
        if (!next.done) {
          resultIt.push(next.value)
        } else {
          resultIt.close()
        }
        return resultIt.next()
      },
    }),
    {
      pass: (msg) => t.pass(msg),
      fail: (msg) => t.fail(msg),
    },
    {
      key: 'external',
      chunkSize: 1024 * 1024,
      count: 200,
      warmUpCount: 100,
    },
  )
})

test('pushable-iterator/heap mem', async (t) => {
  t.plan(1)

  const resultIt = new PushableIterator(createArrayBufferStrategy<any>())

  await memTest(
    (it) => ({
      next() {
        const next = it.next()
        if (!next.done) {
          resultIt.push(next.value)
        } else {
          resultIt.close()
        }
        return resultIt.next()
      },
    }),
    {
      pass: (msg) => t.pass(msg),
      fail: (msg) => t.fail(msg),
    },
    {
      key: 'rss',
      chunkSize: 1024 * 1024,
      count: 5000,
      warmUpCount: 100,
    },
  )
})
