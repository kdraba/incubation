import test from 'tape'

import {fork} from './fork'
import {fromCombineLatest} from './from-combine-latest'
import {concatMap} from './operator/core/concat-map'
import {toArray} from './operator/finite/to-array'
import {asyncSource} from './pipe'

test('fork: empty source iterator and two forks', async (t) => {
  t.plan(1)

  const it: Iterator<never> = [][Symbol.iterator]()

  const v = fromCombineLatest(fork(it, [(v) => v, (v) => v]))

  const resultIt = v.pipe(toArray())
  const result = await resultIt[Symbol.asyncIterator]().next()

  t.ok(result.done)
})

test('fork: two forks simply emit source values', async (t) => {
  t.plan(1)

  const it: Iterator<number> = [1, 2][Symbol.iterator]()

  const v = fromCombineLatest(fork(it, [(v) => v, (v) => v]))

  const resultIt = v.pipe(toArray())[Symbol.asyncIterator]()
  const result = await resultIt.next()

  t.deepEquals(result.value, [
    {value: [1], previous: [], index: 0},
    {value: [1, 1], previous: [1], index: 1},
    {value: [2, 1], previous: [1, 1], index: 0},
    {value: [2, 2], previous: [2, 1], index: 1},
  ])
})

test('fork: two forks, one concat map values', async (t) => {
  t.plan(1)

  const it: Iterator<number> = [1, 2][Symbol.iterator]()

  const v = fromCombineLatest(
    fork(it, [
      (v) => v,
      (v) =>
        asyncSource({[Symbol.asyncIterator]: () => v})
          .pipe(concatMap((x) => [x, -x][Symbol.iterator]()))
          [Symbol.asyncIterator](),
    ]),
  )

  const resultIt = v.pipe(toArray())[Symbol.asyncIterator]()
  const result = await resultIt.next()

  t.deepEquals(result.value, [
    {value: [1], previous: [], index: 0},
    {value: [1, 1], previous: [1], index: 1},
    {value: [1, -1], previous: [1, 1], index: 1},
    {value: [2, -1], previous: [1, -1], index: 0},
    {value: [2, 2], previous: [2, -1], index: 1},
    {value: [2, -2], previous: [2, 2], index: 1},
  ])
})
