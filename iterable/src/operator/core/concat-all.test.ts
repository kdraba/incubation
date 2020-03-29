import test from 'tape'

import {source} from '../../pipe'
import {toArray} from '../finite/to-array'
import {concatAll} from './concat-all'
import {toAsyncIterator} from './util'

test('concat all: empty', (t) => {
  t.plan(1)

  const it: never[] = []
  const result = source(it).pipe(concatAll())

  t.deepEquals(Array.from(result), [])
})

test('concat all: non empty', (t) => {
  t.plan(1)

  const it = [[1, 2, 3][Symbol.iterator](), [4, 5, 6][Symbol.iterator]()]
  const result = source(it).pipe(concatAll())

  t.deepEquals(Array.from(result), [1, 2, 3, 4, 5, 6])
})

test('async concat all: single non empty', async (t) => {
  t.plan(1)

  const it = [toAsyncIterator([1, 2, 3][Symbol.iterator]())]

  const resultIt = source(it)
    .pipe(concatAll())
    .pipe(toArray())
  const result = (await resultIt[Symbol.asyncIterator]().next()).value

  t.deepEquals(result, [1, 2, 3])
})

test('async concat all: non empty', async (t) => {
  t.plan(1)

  const it = [
    toAsyncIterator([1, 2, 3][Symbol.iterator]()),
    [4, 5, 6][Symbol.iterator](),
  ]

  const resultIt = source(it)
    .pipe(concatAll())
    .pipe(toArray())
  const result = (await resultIt[Symbol.asyncIterator]().next()).value

  t.deepEquals(result, [1, 2, 3, 4, 5, 6])
})
