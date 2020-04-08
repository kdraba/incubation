import test from 'tape'

import {fork} from '../../fork'
import {asyncIterator} from '../../iterator/async-iterator'
import {sequential} from '../../iterator/sequential'
import {asyncSource, source} from '../../pipe'
import {toArray} from '../finite/to-array'
import {combineAll} from './combine-all'
import {concatMap} from './concat-map'
import {filter} from './filter'
import {tap} from './tap'

test('combine-all/async - no iterators', async (t) => {
  t.plan(1)

  const it: Iterable<Iterator<never>> = []

  const resultIt = source(it)
    .pipe(combineAll())
    .pipe(toArray())
  const result = await resultIt[Symbol.asyncIterator]().next()

  t.ok(result.done)
})

test('combine-all/async - single empty sync iterator', async (t) => {
  t.plan(1)

  const it: Iterable<Iterator<never>> = [[][Symbol.iterator]()]

  const resultIt = source(it)
    .pipe(combineAll())
    .pipe(toArray())
  const result = await resultIt[Symbol.asyncIterator]().next()

  t.ok(result.done)
})

test('combine-all/async - single sync iterator with values', async (t) => {
  t.plan(1)

  const it = [[1, 2, 3][Symbol.iterator]()]

  const resultIt = source(it)
    .pipe(combineAll())
    .pipe(toArray())
  const result = await resultIt[Symbol.asyncIterator]().next()

  t.deepEquals(result.value, [
    {value: [1], previous: [], index: 0},
    {value: [2], previous: [1], index: 0},
    {value: [3], previous: [2], index: 0},
  ])
})

test('combine-all/single async iterator with values', async (t) => {
  t.plan(1)

  const values = [1, 2, 3]
  const {resolveNext, promises} = resolveInOrder(values)

  const it = [sequential([promises[0], promises[1], promises[2]])]
  resolveNext()

  const resultIt = source(it)
    .pipe(combineAll())
    .pipe(tap(() => resolveNext()))
    .pipe(toArray())
  const result = await resultIt[Symbol.asyncIterator]().next()

  t.deepEquals(result.value, [
    {value: [1], previous: [], index: 0},
    {value: [2], previous: [1], index: 0},
    {value: [3], previous: [2], index: 0},
  ])
})

test('combine-all/async multiple non empty', async (t) => {
  t.plan(1)

  const values = ['_', 1, 'a', 2, 'b', 3, 'c', 'd'] as const
  const {resolveNext, promises} = resolveInOrder(values)
  resolveNext()
  t
  const it: Iterable<AsyncIterator<string | number>> = [
    sequential([promises[0]]),
    sequential([promises[1], promises[3], promises[5]]),
    sequential([promises[2], promises[4], promises[6]]),
    sequential([promises[7]]),
  ]

  const resultIt = source(it)
    .pipe(combineAll())
    .pipe(tap(() => resolveNext()))
    .pipe(toArray())
  const result = await resultIt[Symbol.asyncIterator]().next()

  t.deepEquals(result.value, [
    {value: [values[0]], previous: [], index: 0},
    {value: [values[0], values[1]], previous: [values[0]], index: 1},
    {
      value: [values[0], values[1], values[2]],
      previous: [values[0], values[1]],
      index: 2,
    },
    {
      value: [values[0], values[3], values[2]],
      previous: [values[0], values[1], values[2]],
      index: 1,
    },
    {
      value: [values[0], values[3], values[4]],
      previous: [values[0], values[3], values[2]],
      index: 2,
    },
    {
      value: [values[0], values[5], values[4]],
      previous: [values[0], values[3], values[4]],
      index: 1,
    },
    {
      value: [values[0], values[5], values[6]],
      previous: [values[0], values[5], values[4]],
      index: 2,
    },
    {
      value: [values[0], values[5], values[6], values[7]],
      previous: [values[0], values[5], values[6]],
      index: 3,
    },
  ])
})

test('combine-all/async - fork and combine sync iterator with values', async (t) => {
  t.plan(1)

  const it = [1, 2, 3][Symbol.iterator]()

  const resultIt = source(fork(it, 2))
    .pipe(combineAll())
    .pipe(toArray())
  const result = await resultIt[Symbol.asyncIterator]().next()

  t.deepEquals(result.value, [
    {value: [1], previous: [], index: 0},
    {value: [1, 1], previous: [1], index: 1},
    {value: [2, 1], previous: [1, 1], index: 0},
    {value: [2, 2], previous: [2, 1], index: 1},
    {value: [3, 2], previous: [2, 2], index: 0},
    {value: [3, 3], previous: [3, 2], index: 1},
  ])
})

test('combine-all/async - fork and combine async iterator with values', async (t) => {
  t.plan(1)

  const it = asyncIterator([1, 2, 3][Symbol.iterator]())

  const resultIt = source(fork(it, 2))
    .pipe(combineAll())
    .pipe(toArray())
  const result = await resultIt[Symbol.asyncIterator]().next()

  t.deepEquals(result.value, [
    {value: [1], previous: [], index: 0},
    {value: [1, 1], previous: [1], index: 1},
    {value: [2, 1], previous: [1, 1], index: 0},
    {value: [2, 2], previous: [2, 1], index: 1},
    {value: [3, 2], previous: [2, 2], index: 0},
    {value: [3, 3], previous: [3, 2], index: 1},
  ])
})

test('combine-all/async - fork and combine sync iterator with values and filter', async (t) => {
  t.plan(1)

  const it = [1, 2][Symbol.iterator]()
  const [forked1, forked2] = fork(it, 2)

  const resultIt = source([
    forked1,
    asyncSource({[Symbol.asyncIterator]: () => forked2})
      .pipe(filter((v) => v % 2 === 0))
      [Symbol.asyncIterator](),
  ])
    .pipe(combineAll())
    .pipe(toArray())
  const result = await resultIt[Symbol.asyncIterator]().next()

  t.deepEquals(result.value, [
    {value: [1], previous: [], index: 0},
    {value: [2], previous: [1], index: 0},
    {value: [2, 2], previous: [2], index: 1},
  ])
})

test('combine-all/async - fork and combine sync iterator with values and concatMap', async (t) => {
  t.plan(1)

  const it = [1, 2][Symbol.iterator]()
  const [forked1, forked2] = fork(it, 2)

  const resultIt = source([
    forked1,
    asyncSource({[Symbol.asyncIterator]: () => forked2})
      .pipe(concatMap((v) => [v, v + 10][Symbol.iterator]()))
      [Symbol.asyncIterator](),
  ])
    .pipe(combineAll())
    .pipe(toArray())
  const result = await resultIt[Symbol.asyncIterator]().next()

  t.deepEquals(result.value, [
    {value: [1], previous: [], index: 0},
    {value: [1, 1], previous: [1], index: 1},
    {value: [1, 11], previous: [1, 1], index: 1},
    {value: [2, 11], previous: [1, 11], index: 0},
    {value: [2, 2], previous: [2, 11], index: 1},
    {value: [2, 12], previous: [2, 2], index: 1},
  ])
})

function resolveInOrder<TValues extends readonly any[]>(
  values: TValues,
): {
  resolveNext: () => boolean
  promises: {[index in keyof TValues]: Promise<TValues[index]>}
} {
  let index = 0

  const promises: Array<{
    promise: Promise<unknown>
    resolve: () => void
  }> = values.map((value) => {
    let resolver: (() => void) | undefined
    const promise = new Promise((resolve) => {
      resolver = () => resolve(value)
    })

    return {promise, resolve: resolver!}
  })

  return {
    promises: promises.map(({promise}) => promise) as any,
    resolveNext: () => {
      if (index < promises.length) {
        promises[index].resolve()
        index++
        return true
      } else {
        return false
      }
    },
  }
}
