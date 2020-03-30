import test from 'tape'

import {memTest} from '../mem-test'

test('iterator/heap mem', async (t) => {
  t.plan(1)

  await memTest(
    (it) => it,
    {
      pass: (msg) => t.pass(msg),
      fail: (msg) => t.fail(msg),
    },
    {
      key: 'heapUsed',
      chunkSize: 1024 * 1024,
      count: 10000,
      warmUpCount: 100,
    },
  )
})
