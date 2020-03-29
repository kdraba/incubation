import test from 'tape'

import {asyncIterable} from '../../iterator/async-iterable'
import {asyncSource, source} from '../../pipe'
import {last} from './last'

test('last/sync/empty iterable', (t) => {
  t.plan(1)

  const it: any[] = []
  const result = source(it).pipe(last())

  t.deepEquals(Array.from(result), [])
})

test('last/sync/non empty iterable', (t) => {
  t.plan(1)

  const it = [1, 2, 3]
  const result = source(it).pipe(last())

  t.deepEquals(Array.from(result), [3])
})

test('last/async/empty iterable', async (t) => {
  t.plan(1)

  const it = asyncIterable([])
  const resultIt = asyncSource(it)
    .pipe(last())
    [Symbol.asyncIterator]()

  const result1 = await resultIt.next()
  t.equals(result1.done, true)
})

test('last/async/non empty iterable', async (t) => {
  t.plan(2)

  const it = asyncIterable([1, 2, 3])
  const resultIt = asyncSource(it)
    .pipe(last())
    [Symbol.asyncIterator]()

  const result1 = await resultIt.next()
  t.equals(result1.value, 3)

  const result2 = await resultIt.next()
  t.equals(result2.done, true)
})
