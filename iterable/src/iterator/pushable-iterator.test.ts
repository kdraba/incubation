import test from 'tape'

import {toArray} from '../operator/finite/to-array'
import {asyncSource} from '../pipe'
import {createArrayBufferStrategy} from './array-buffer-strategy'
import {PushableIterator} from './pushable-iterator'

function createPushableIterator() {
  return new PushableIterator<number, number, number[]>(
    createArrayBufferStrategy(),
  )
}

test('pushable-iterator/push and next - push, next, await, push, next, await', async (t) => {
  const it = createPushableIterator()

  t.plan(2)

  t.comment('push the first value')
  it.push(1)

  t.deepEqual(
    await it.next(),
    {
      done: false,
      value: 1,
    },
    'the first iterated value should be the first pushed value',
  )

  t.comment('push the second value')
  it.push(2)

  t.deepEqual(
    await it.next(),
    {
      done: false,
      value: 2,
    },
    'the second iterated value should be the second pushed value',
  )
})

test('pushable-iterator/push and next - next, push, await, next push await', async (t) => {
  const it = createPushableIterator()

  t.plan(2)

  t.comment('first next')
  const v1 = it.next()

  t.comment('push the first value')
  it.push(1)

  t.deepEqual(
    await v1,
    {
      done: false,
      value: 1,
    },
    'await the first iterated value, it should be the first pushed value',
  )

  t.comment('second next')
  const v2 = it.next()

  t.comment('push the second value')
  it.push(2)

  t.deepEqual(
    await v2,
    {
      done: false,
      value: 2,
    },
    'await the second iterated value, it should be the second pushed value',
  )
})

test('pushable-iterator/push and next - next, next, push, push, await, await', async (t) => {
  const it = createPushableIterator()

  t.plan(2)

  t.comment('first next')
  const v1 = it.next()
  t.comment('second next')
  const v2 = it.next()

  t.comment('push the first value')
  it.push(1)

  t.comment('push a second value')
  it.push(2)

  t.deepEqual(
    await v1,
    {
      done: false,
      value: 1,
    },
    'await the first iterated value, it should be the first pushed value',
  )

  t.deepEqual(
    await v2,
    {
      done: false,
      value: 2,
    },
    'await the second iterated value, it should also be the second pushed value',
  )
})

test('pushable-iterator/push preceeds iteration', async (t) => {
  const it = createPushableIterator()

  t.plan(2)

  t.comment('push the first value')
  it.push(1)
  t.comment('push the second value')
  it.push(2)

  t.deepEqual(
    await it.next(),
    {
      done: false,
      value: 1,
    },
    'the first iterated value should be the first pushed value',
  )

  t.deepEqual(
    await it.next(),
    {
      done: false,
      value: 2,
    },
    'the second iterated value should be the second pushed value',
  )
})

test('pushable-iterator/close after reading first pushed value', async (t) => {
  const it = createPushableIterator()

  t.plan(5)

  t.comment('push the first value')
  it.push(1)
  t.comment('push the second value')
  it.push(2)

  t.deepEqual(
    await it.next(),
    {
      done: false,
      value: 1,
    },
    'the first iterated value should be the first pushed value',
  )

  t.comment('close the iterator')
  it.close()

  t.equal(it.push(3), false, 'pushing to a closed iterator should fail')
  t.equal(it.close(), false, 'closing an already closed iterator should fail')

  t.deepEqual(
    await it.next(),
    {
      done: false,
      value: 2,
    },
    'the second iterated value should be the second pushed value',
  )

  t.comment('return the iterator')
  it.return()

  t.deepEqual(
    await it.next(),
    {
      done: true,
      value: undefined,
    },
    'the iterator should be closed',
  )
})

test('pushable-iterator/iteration preceeds push', async (t) => {
  t.plan(2)

  const it = createPushableIterator()

  t.comment('iterate the first value')
  const result1 = it.next()
  t.comment('iterate the second value')
  const result2 = it.next()

  t.comment('push the first value')
  it.push(1)
  t.comment('push the second value')
  it.push(2)

  t.deepEqual(
    await result1,
    {
      done: false,
      value: 1,
    },
    'the first iterated value should resolve to the first pushed value',
  )

  t.deepEqual(
    await result2,
    {
      done: false,
      value: 2,
    },
    'the second iterated value should resolve to the second pushed value',
  )
})

test('pushable-iterator/iteration preceeds push and iterator gets returned', async (t) => {
  t.plan(2)

  const it = createPushableIterator()

  t.comment('iterate the first value')
  const result1 = it.next()
  t.comment('iterate the second value')
  const result2 = it.next()

  t.comment('push the first value')
  it.push(1)

  t.deepEqual(
    await result1,
    {
      done: false,
      value: 1,
    },
    'the first iterated value should resolve to the first pushed value',
  )

  t.comment('return the iterator')
  it.return()

  t.deepEqual(
    await result2,
    {
      done: true,
      value: undefined,
    },
    'the second iterated value should resolve to done value',
  )
})

test('pushable-iterator/multiple values', async (t) => {
  t.plan(1)

  const pushIt = new PushableIterator(createArrayBufferStrategy())
  pushIt.push(0)
  pushIt.push(1)
  pushIt.push(2)
  pushIt.close()

  const values = (
    await asyncSource({[Symbol.asyncIterator]: () => pushIt})
      .pipe(toArray())
      [Symbol.asyncIterator]()
      .next()
  ).value
  t.deepEquals(values, [0, 1, 2])
})
