import test from 'tape'

import {memTest} from '../../mem-test'
import {map} from './map'

test('map/external mem test', (t) => {
  t.plan(1)

  memTest(
    (it) => map((v) => v)(it),
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

test('map/heap mem test', (t) => {
  t.plan(1)

  memTest(
    (it) => map((v) => v)(it),
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
