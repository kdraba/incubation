import test from 'tape'

import {source} from '../../pipe'
import {toArray} from './to-array'

test('empty iterable', (t) => {
  t.plan(1)

  const it: any[] = []
  const result = source(it).pipe(toArray())

  t.deepEquals(Array.from(result), [])
})

test('non empty iterable', (t) => {
  t.plan(1)

  const it = [1, 2, 3]
  const result = source(it).pipe(toArray())

  t.deepEquals(Array.from(result), [[1, 2, 3]])
})
