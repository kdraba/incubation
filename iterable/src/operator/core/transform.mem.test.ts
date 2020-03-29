import test from 'tape'

import {asyncIterator} from '../../iterator/async-iterator'
import {memTest} from '../../mem-test'
import {transform} from './transform'

test('transform/external mem test', async (t) => {
  t.plan(1)

  await memTest(
    transform({
      update: (value) => ({
        emit: true,
        proceed: true,
        clear: false,
        value,
        state: value,
      }),
    }),
    {
      pass: (msg) => t.pass(msg),
      fail: (msg) => t.fail(msg),
    },
    {
      key: 'external',
      chunkSize: 1024,
      count: 200,
      warmUpCount: 100,
    },
  )
})

test('transform/heap mem test', async (t) => {
  t.plan(1)

  await memTest(
    transform({
      update: (value) => ({
        emit: true,
        proceed: true,
        clear: false,
        value,
        state: value,
      }),
    }),
    {
      pass: (msg) => t.pass(msg),
      fail: (msg) => t.fail(msg),
    },
    {
      key: 'rss',
      chunkSize: 128,
      count: 20000,
      warmUpCount: 100,
    },
  )
})

test('transform/async/heap mem test', async (t) => {
  t.plan(1)

  await memTest(
    (it) =>
      transform({
        update: (value) => ({
          emit: true,
          proceed: true,
          clear: false,
          value,
          state: value,
        }),
      })(asyncIterator(it)),
    {
      pass: (msg) => t.pass(msg),
      fail: (msg) => t.fail(msg),
    },
    {
      key: 'rss',
      chunkSize: 128,
      count: 2000,
      warmUpCount: 100,
    },
  )
})
