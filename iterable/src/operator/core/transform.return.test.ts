import {SinonSpy, spy} from 'sinon'
import test from 'tape'

import {asyncIterable} from '../../iterator/async-iterable'
import {createPushablePromise} from '../../iterator/create-pushable-promise'
import {asyncSource, source} from '../../pipe'
import {transform} from './transform'

function createIterable<T>(values: T[], returnSpy?: SinonSpy) {
  return {
    [Symbol.iterator]: () => {
      const internalIt = values[Symbol.iterator]()
      return {
        next: () => internalIt.next(),
        return: returnSpy,
      }
    },
  }
}

test('transform/sync/return/iterator ended normally, source return called', (t) => {
  t.plan(1)

  const returnSpy = spy()
  const it = createIterable([true], returnSpy)

  const result = source(it)
    .pipe(
      transform({
        update: () => ({emit: false, proceed: true, clear: true}),
      }),
    )
    [Symbol.iterator]()

  result.next()

  t.true(returnSpy.calledOnce)
})

test('transform/sync/return/return called after iterator ended normally, source return called', (t) => {
  t.plan(1)

  const returnSpy = spy()
  const it = createIterable([true], returnSpy)

  const result = source(it)
    .pipe(
      transform({
        update: () => ({emit: false, proceed: true, clear: true}),
      }),
    )
    [Symbol.iterator]()

  result.next()
  result.return && result.return()

  t.true(returnSpy.calledOnce, 'source return called')
})

test('transform/sync/return/iterator ended by invoking return, source return called once', (t) => {
  t.plan(1)

  const returnSpy = spy()
  const it = createIterable([true], returnSpy)

  const result = source(it)
    .pipe(
      transform({
        update: () => ({emit: false, proceed: true, clear: true}),
      }),
    )
    [Symbol.iterator]()

  result.return && result.return()

  t.true(returnSpy.calledOnce)
})

test('transform/async/return/iterator ended due to soource end, source return called once', async (t) => {
  t.plan(1)

  const returnSpyPromise = createPushablePromise<void>()
  const returnSpy = spy(() => {
    returnSpyPromise.push()
    return Promise.resolve({done: true})
  })
  const it = asyncIterable(createIterable([true], returnSpy))

  const result = asyncSource(it)
    .pipe(
      transform({
        update: (value) => ({emit: true, value, proceed: true, clear: true}),
      }),
    )
    [Symbol.asyncIterator]()

  await result.next()
  await result.next()

  await returnSpyPromise

  t.true(returnSpy.calledOnce)
})

test('transform/async/return/iterator ended due to emit finish, source return called once', async (t) => {
  t.plan(1)

  const returnSpyPromise = createPushablePromise<void>()
  const returnSpy = spy(() => {
    returnSpyPromise.push()
    return Promise.resolve({done: true})
  })
  const it = asyncIterable(createIterable([true], returnSpy))

  const result = asyncSource(it)
    .pipe(
      transform<boolean, boolean, undefined>({
        update: () => ({emit: false, clear: true, proceed: 'finish'}),
      }),
    )
    [Symbol.asyncIterator]()

  await result.next()

  await returnSpyPromise

  t.true(returnSpy.calledOnce)
})

test('transform/sync/return/invoking finish on return', (t) => {
  t.plan(3)

  const it = createIterable([1, 2, 3, 4])

  const result = source(it)
    .pipe(
      transform({
        update: (value) => ({
          emit: true,
          proceed: true,
          value,
          clear: false,
          state: value,
        }),
        finish: (state) => ({
          emit: true,
          value: 100 + (state.hasValue ? state.value : 0),
        }),
      }),
    )
    [Symbol.iterator]()

  result.next()
  result.next()

  t.true(result.return, 'has return method')

  const returnResult = result.return && result.return()

  t.true(returnResult?.done)
  t.equal(returnResult?.value, 102)
})
