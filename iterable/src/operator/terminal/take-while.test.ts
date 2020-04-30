import {spy} from 'sinon'
import test from 'tape'

import {asyncIterable} from '../../iterator/async-iterable'
import {createPushablePromise} from '../../iterator/create-pushable-promise'
import {asyncSource, source} from '../../pipe'
import {toArray} from '../finite/to-array'
import {takeWhile} from './take-while'

test('take-while', (t) => {
  t.plan(1)

  const it = [true, true, false, true]
  const result = source(it).pipe(takeWhile((value) => value))

  t.deepEquals(Array.from(result), [true, true])
})

test('take-while/inclusive', (t) => {
  t.plan(1)

  const it = [true, true, false, true]
  const result = source(it).pipe(takeWhile((value) => value, {inclusive: true}))

  t.deepEquals(Array.from(result), [true, true, false])
})

test('take-while/complete', (t) => {
  t.plan(1)

  const it = [true, true]
  const result = source(it).pipe(takeWhile((value) => value))

  t.deepEquals(Array.from(result), [true, true])
})

test('take-while/sync/with return', (t) => {
  t.plan(2)

  const values = [true, true, false, true][Symbol.iterator]()
  const it = {
    next: spy(() => values.next()),
    return: spy(),
  }

  const result = source({[Symbol.iterator]: () => it})
    .pipe(takeWhile((value) => value))
    [Symbol.iterator]()

  let done = false
  while (!done) {
    const value = result.next()
    done = !!value.done
  }

  t.equal(it.next.callCount, 3, 'next has been called times')
  t.true(it.return.calledOnce, 'return has been called')
})

test('take-while/async/with return', async (t) => {
  t.plan(2)
  const returnSpyPromise = createPushablePromise<void>()
  const returnSpy = spy(() => {
    returnSpyPromise.push()
    return Promise.resolve({done: true} as IteratorResult<boolean>)
  })

  const values = asyncIterable([true, true, false, true])[
    Symbol.asyncIterator
  ]()
  const it = {
    next: spy(() => values.next()),
    return: returnSpy,
  }

  const result = asyncSource({[Symbol.asyncIterator]: () => it})
    .pipe(takeWhile((value) => value))
    [Symbol.asyncIterator]()

  let done = false
  while (!done) {
    const value = await result.next()
    done = !!value.done
  }

  t.equal(it.next.callCount, 3, 'next has been called times')

  await returnSpyPromise
  t.true(it.return.calledOnce, 'return has been called')
})

test('take-while/none', (t) => {
  t.plan(1)

  const it = [false]
  const result = source(it).pipe(takeWhile((value) => value))

  t.deepEquals(Array.from(result), [])
})

test('take-while/async', async (t) => {
  t.plan(1)

  const it = asyncIterable([true, true, false, true])
  const result = await asyncSource(it)
    .pipe(takeWhile((value) => value))
    .pipe(toArray())
    [Symbol.asyncIterator]()
    .next()

  t.deepEquals(Array.from(result.value), [true, true])
})
