import test from 'tape'

import {asyncIterable} from '../../iterator/async-iterable'
import {asyncSource, source} from '../../pipe'
import {toArray} from '../finite/to-array'
import {transform} from './transform'

test('transform/empty input', (t) => {
  t.plan(1)

  const it = [true]
  const result = source(it).pipe(
    transform({
      update: () => ({emit: false, proceed: true, clear: true}),
    }),
  )

  t.deepEquals(Array.from(result), [])
})

test('transform/sync number input', (t) => {
  t.plan(1)

  const it = [1, 2, 3]
  const result = source(it).pipe(
    transform({
      update: (value) => ({emit: true, proceed: true, clear: true, value}),
    }),
  )

  t.deepEquals(Array.from(result), [1, 2, 3])
})

test('transform/sync number input with toArray', (t) => {
  t.plan(1)

  const it = [1, 2, 3]
  const result = source(it)
    .pipe(
      transform({
        update: (value) => ({emit: true, proceed: true, clear: true, value}),
      }),
    )
    .pipe(toArray())

  t.deepEquals(result[Symbol.iterator]().next().value, [1, 2, 3])
})

test('transform/sync object input', (t) => {
  t.plan(1)

  const it = [{value: 1}, {value: 2}, {value: 3}]
  const result = source(it).pipe(
    transform({
      update: (value) => ({emit: true, proceed: true, clear: true, value}),
    }),
  )

  t.deepEquals(Array.from(result), [{value: 1}, {value: 2}, {value: 3}])
})

test('transform/sync filter true values', (t) => {
  t.plan(1)

  const it = [true, false, true]
  const result = source(it).pipe(
    transform({
      update: (value) =>
        value
          ? {emit: true, proceed: true, clear: true, value}
          : {emit: false, proceed: true, clear: true},
    }),
  )

  t.deepEquals(Array.from(result), [true, true])
})

test('transform/sync finish', (t) => {
  t.plan(1)

  const it = [false]
  const result = source(it).pipe(
    transform({
      update: () => ({emit: false, proceed: 'finish', clear: true}),
      finish: () => ({emit: true, value: true}),
    }),
  )

  t.deepEquals(Array.from(result), [true])
})

test('transform/async number values', async (t) => {
  t.plan(4)

  const it = asyncIterable([1, 2, 3])
  const resultIt = asyncSource(it)
    .pipe(
      transform({
        update: (value) => ({emit: true, proceed: true, clear: true, value}),
      }),
    )
    [Symbol.asyncIterator]()

  const result1 = await resultIt.next()
  t.deepEquals(result1.value, 1)
  const result2 = await resultIt.next()
  t.deepEquals(result2.value, 2)
  const result3 = await resultIt.next()
  t.deepEquals(result3.value, 3)
  const result4 = await resultIt.next()
  t.deepEquals(result4.done, true)
})

test('transform/async number values with toArray', async (t) => {
  t.plan(1)

  const it = asyncIterable([1, 2, 3])
  const resultIt = asyncSource(it)
    .pipe(
      transform({
        update: (value) => ({emit: true, proceed: true, clear: true, value}),
      }),
    )
    .pipe(toArray())
  const result = (await resultIt[Symbol.asyncIterator]().next()).value

  t.deepEquals(result, [1, 2, 3])
})

test('transform', async (t) => {
  t.plan(1)

  const it = asyncIterable([{value: 1}, {value: 2}, {value: 3}])
  const resultIt = asyncSource(it)
    .pipe(
      transform({
        update: (value) => ({emit: true, proceed: true, clear: true, value}),
      }),
    )
    .pipe(toArray())
  const result = (await resultIt[Symbol.asyncIterator]().next()).value

  t.deepEquals(result, [{value: 1}, {value: 2}, {value: 3}])
})

test('transform: many to one', (t) => {
  t.plan(1)

  const it = [1, 1, 2, 2, 3, 3, 4]
  const result = source(it).pipe(
    transform<number, number, {sum: number; count: number}>({
      update: (value: number, _index, state) => {
        return state.hasValue && state.value.count >= 1
          ? {
              emit: true,
              value: state.value.sum + value,
              proceed: true,
              clear: true,
            }
          : {
              emit: false,
              proceed: true,
              clear: false,
              state: {
                count: ((state.hasValue && state.value.count) || 0) + 1,
                sum: ((state.hasValue && state.value.sum) || 0) + value,
              },
            }
      },
      finish: (state) => ({
        emit: true,
        value: (state.hasValue && state.value.sum) || 0,
      }),
    }),
  )

  t.deepEquals(Array.from(result), [2, 4, 6, 4])
})

test('transform: one to many', (t) => {
  t.plan(1)

  const it = [1, 2, 3]
  const result = source(it).pipe(
    transform<number, number, number>({
      update: (value: number, _index, state) => {
        return state.hasValue && state.value > 1
          ? {emit: false, proceed: true, clear: true}
          : {
              emit: true,
              proceed: false,
              value,
              clear: false,
              state: ((state.hasValue && state.value) || 0) + 1,
            }
      },
    }),
  )

  t.deepEquals(Array.from(result), [1, 1, 2, 2, 3, 3])
})

test('transform/finish and emit', (t) => {
  t.plan(2)

  let counter = 0
  const it = {
    [Symbol.iterator]: () => ({
      next() {
        const value = counter++
        return {value, done: false}
      },
    }),
  }
  const result = source(it).pipe(
    transform({
      update: (value) => ({emit: true, value, proceed: 'finish', clear: true}),
    }),
  )

  t.deepEquals(Array.from(result), [0])
  t.equals(counter, 1, 'count of next calls')
})
