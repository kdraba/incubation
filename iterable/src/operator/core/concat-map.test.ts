import test from 'tape'

import {source} from '../../pipe'
import {toArray} from '../finite/to-array'
import {concatMap} from './concat-map'
import {toAsyncIterator} from './util'

test('sync concat map: empty', (t) => {
  t.plan(1)

  const it: any[] = []
  const result = source(it).pipe(concatMap(() => [][Symbol.iterator]()))

  t.deepEquals(Array.from(result), [])
})

test('sync concat map: map to empty', (t) => {
  t.plan(1)

  const it: number[] = [1, 2, 3]
  const result = source(it).pipe(concatMap(() => [][Symbol.iterator]()))

  t.deepEquals(Array.from(result), [])
})

test('sync concat map: map to values', (t) => {
  t.plan(1)

  const it: number[] = [1, 2, 3]
  const result = source(it).pipe(concatMap((v) => [v, v][Symbol.iterator]()))

  t.deepEquals(Array.from(result), [1, 1, 2, 2, 3, 3])
})

test('async concat map: sync in - map to async empty', async (t) => {
  t.plan(1)

  const it: any[] = []
  const resultIt = source(it)
    .pipe(concatMap(() => toAsyncIterator([][Symbol.iterator]())))
    .pipe(toArray())
  const result = (await resultIt[Symbol.asyncIterator]().next()).done

  t.ok(result)
})

test('async concat map: sync in - map to async values', async (t) => {
  t.plan(1)

  const it: number[] = [1, 2, 3]
  const resultIt = source(it)
    .pipe(concatMap((v) => toAsyncIterator([v, v][Symbol.iterator]())))
    .pipe(toArray())
  const result = (await resultIt[Symbol.asyncIterator]().next()).value

  t.deepEquals(result, [1, 1, 2, 2, 3, 3])
})

test('async concat map: sync in - map to promise of sync empty', async (t) => {
  t.plan(1)

  const it: any[] = []
  const resultIt = source(it)
    .pipe(concatMap(() => Promise.resolve([][Symbol.iterator]())))
    .pipe(toArray())
  const result = (await resultIt[Symbol.asyncIterator]().next()).done

  t.ok(result)
})

test('async concat map: sync in - map to promise of sync values', async (t) => {
  t.plan(1)

  const it: number[] = [1, 2, 3]
  const resultIt = source(it)
    .pipe(concatMap((v) => Promise.resolve([v, v][Symbol.iterator]())))
    .pipe(toArray())
  const result = (await resultIt[Symbol.asyncIterator]().next()).value

  t.deepEquals(result, [1, 1, 2, 2, 3, 3])
})

test('async concat map: sync in - map to promise of async empty', async (t) => {
  t.plan(1)

  const it: any[] = []
  const resultIt = source(it)
    .pipe(
      concatMap(() => Promise.resolve(toAsyncIterator([][Symbol.iterator]()))),
    )
    .pipe(toArray())
  const result = (await resultIt[Symbol.asyncIterator]().next()).done

  t.ok(result)
})

test('async concat map: sync in - map to promise of async values', async (t) => {
  t.plan(1)

  const it: number[] = [1, 2, 3]
  const resultIt = source(it)
    .pipe(
      concatMap((v) =>
        Promise.resolve(toAsyncIterator([v, v][Symbol.iterator]())),
      ),
    )
    .pipe(toArray())
  const result = (await resultIt[Symbol.asyncIterator]().next()).value

  t.deepEquals(result, [1, 1, 2, 2, 3, 3])
})

test('async concat map: sync in - map to sync and async values', async (t) => {
  t.plan(1)

  const it: number[] = [1, 2, 3]
  const resultIt = source(it)
    .pipe(
      concatMap((v) =>
        v % 2 === 0
          ? [v, v][Symbol.iterator]()
          : toAsyncIterator([v, v][Symbol.iterator]()),
      ),
    )
    .pipe(toArray())
  const result = (await resultIt[Symbol.asyncIterator]().next()).value

  t.deepEquals(result, [1, 1, 2, 2, 3, 3])
})
