import test from 'tape'

import {memTest} from '../../mem-test'
import {mergeAll} from './merge-all'

test('mergeAll/external mem test', async (t) => {
  t.plan(1)

  await memTest(
    (it) => mergeAll()([it][Symbol.iterator]()),
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

test('mergeAll/heap mem test', async (t) => {
  t.plan(1)

  await memTest(
    (it) => mergeAll()([it][Symbol.iterator]()),
    {
      pass: (msg) => t.pass(msg),
      fail: (msg) => t.fail(msg),
    },
    {
      key: 'heapUsed',
      chunkSize: 128,
      count: 10000,
      warmUpCount: 100,
    },
  )
})
