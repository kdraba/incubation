import test from 'tape'

import {createArrayBufferStrategy} from '../../iterator/array-buffer-strategy'
import {PushableIterator} from '../../iterator/pushable-iterator'
import {asyncSource, source} from '../../pipe'
import {toArray} from '../finite/to-array'
import {take} from './take'

test('take some', (t) => {
  t.plan(1)

  const it: number[] = [1, 2, 3, 4, 5, 6]
  const resultIt = source(it)
    .pipe(take(3))
    .pipe(toArray())
  const result = resultIt[Symbol.iterator]().next().value

  t.deepEquals(result, [1, 2, 3])
})

test('take none', (t) => {
  t.plan(1)

  const it: number[] = [1, 2, 3]
  const resultIt = source(it)
    .pipe(take(0))
    .pipe(toArray())
  const result = resultIt[Symbol.iterator]().next().value

  t.deepEquals(result, undefined)
})

test('take more than available', (t) => {
  t.plan(1)

  const it: number[] = [1, 2, 3]
  const resultIt = source(it)
    .pipe(take(it.length + 1))
    .pipe(toArray())
  const result = resultIt[Symbol.iterator]().next().value

  t.deepEquals(result, [1, 2, 3])
})

test('take from infinite iterator', async (t) => {
  t.plan(1)

  let counter = 0
  const it = {
    next() {
      const value = counter++
      return {value, done: false}
    },
  }

  const values = source({[Symbol.iterator]: () => it})
    .pipe(take(3))
    .pipe(toArray())
    [Symbol.iterator]()
    .next().value
  t.deepEquals(values, [0, 1, 2])
})

test('take from async infinite iterator', async (t) => {
  t.plan(1)

  let counter = 0
  const it = {
    next() {
      const value = counter++
      return Promise.resolve({value, done: false})
    },
  }

  const values = (
    await asyncSource({[Symbol.asyncIterator]: () => it})
      .pipe(take(3))
      .pipe(toArray())
      [Symbol.asyncIterator]()
      .next()
  ).value
  t.deepEquals(values, [0, 1, 2])
})

test('take from closed pushable iterator', async (t) => {
  t.plan(1)

  const pushIt = new PushableIterator(createArrayBufferStrategy())
  pushIt.push(0)
  pushIt.push(1)
  pushIt.push(2)
  pushIt.close()

  const values = (
    await asyncSource({[Symbol.asyncIterator]: () => pushIt})
      .pipe(take(3))
      .pipe(toArray())
      [Symbol.asyncIterator]()
      .next()
  ).value
  t.deepEquals(values, [0, 1, 2])
})

test('take from open pushable iterator', async (t) => {
  t.plan(1)

  const pushIt = new PushableIterator(createArrayBufferStrategy())
  pushIt.push(0)
  pushIt.push(1)
  pushIt.push(2)

  const values = (
    await asyncSource({[Symbol.asyncIterator]: () => pushIt})
      .pipe(take(3))
      .pipe(toArray())
      [Symbol.asyncIterator]()
      .next()
  ).value
  t.deepEquals(values, [0, 1, 2])
})
