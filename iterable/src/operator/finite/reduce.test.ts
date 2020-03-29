import test from 'tape'

import {asyncIterable} from '../../iterator/async-iterable'
import {asyncSource, source} from '../../pipe'
import {reduce} from './reduce'

test('reduce/sync/empty iterable', (t) => {
  t.plan(1)

  const it: any[] = []
  const result = source(it).pipe(reduce((agg, v) => agg + v, 0))

  t.deepEquals(Array.from(result), [])
})

test('reduce/sync/non empty iterable', (t) => {
  t.plan(1)

  const it = [1, 1, 1]
  const result = source(it).pipe(reduce((agg: number, v) => agg + v, 0))

  t.deepEquals(Array.from(result), [3])
})

test('reduce/async/non empty iterable', async (t) => {
  t.plan(2)

  const it = asyncIterable([1, 1, 1])
  const resultIt = asyncSource(it)
    .pipe(reduce((agg: number, v) => agg + v, 0))
    [Symbol.asyncIterator]()

  const result1 = await resultIt.next()
  t.equals(result1.value, 3)

  const result2 = await resultIt.next()
  t.equals(result2.done, true)
})
