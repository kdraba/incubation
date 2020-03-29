import test from 'tape'

import {createArrayBufferStrategy} from '../../iterator/array-buffer-strategy'
import {PushableIterator} from '../../iterator/pushable-iterator'
import {asyncSource, source} from '../../pipe'
import {toArray} from '../finite/to-array'
import {take} from '../terminal/take'
import {prefetch} from './prefetch'

test('prefetch: returns all the items', async (t) => {
  t.plan(1)

  const it: number[] = [1, 2, 3, 4, 5, 6]
  const resultIt = source(it)
    .pipe(prefetch(2))
    .pipe(toArray())
  const result = (await resultIt[Symbol.asyncIterator]().next()).value

  t.deepEquals(result, it)
})

test('prefetch: prefetches items', async (t) => {
  t.plan(2)

  const pushIt = new PushableIterator(createArrayBufferStrategy())

  let counter = 0
  const it = {
    next() {
      const value = counter++
      pushIt.push(value)
      return {value, done: false}
    },
  }

  const prefetchCount = 3

  const resultIt = source({[Symbol.iterator]: () => it})
    .pipe(prefetch(prefetchCount))
    [Symbol.asyncIterator]()

  const result = await resultIt.next()
  t.equals(result.value, 0)

  const values = (
    await asyncSource({[Symbol.asyncIterator]: () => pushIt})
      .pipe(take(prefetchCount))
      .pipe(toArray())
      [Symbol.asyncIterator]()
      .next()
  ).value
  t.deepEquals(values, [0, 1, 2])
})
