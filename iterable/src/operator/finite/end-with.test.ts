import test from 'tape'

import {asyncIterable} from '../../iterator/async-iterable'
import {asyncSource, source} from '../../pipe'
import {endWith} from './end-with'
import {toArray} from './to-array'

test('endWith/sync/empty iterable', (t) => {
  t.plan(1)

  const it: number[] = []
  const result = source(it).pipe(endWith(10))

  t.deepEquals(Array.from(result), [10])
})

test('endWith/sync/non empty iterable', (t) => {
  t.plan(1)

  const it = [1, 2, 3]
  const result = source(it).pipe(endWith(10))

  t.deepEquals(Array.from(result), [1, 2, 3, 10])
})

test('endWith/async/empty iterable', async (t) => {
  t.plan(2)

  const it: AsyncIterable<number> = asyncIterable([])
  const resultIt = asyncSource(it)
    .pipe(endWith(10))
    [Symbol.asyncIterator]()

  const result1 = await resultIt.next()
  t.equals(result1.value, 10)

  const result2 = await resultIt.next()
  t.equals(result2.done, true)
})

test('endWith/async/non empty iterable', async (t) => {
  t.plan(2)

  const it = asyncIterable([1, 2, 3])
  const resultIt = asyncSource(it)
    .pipe(endWith(10))
    .pipe(toArray())
    [Symbol.asyncIterator]()

  const result1 = await resultIt.next()
  t.deepEquals(result1.value, [1, 2, 3, 10])

  const result2 = await resultIt.next()
  t.equals(result2.done, true)
})
