import {SinonSpy, spy} from 'sinon'
import test from 'tape'

import {source} from '../../pipe'
import {transform} from './transform'

function createIterator<T>(values: T[], returnSpy?: SinonSpy) {
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

test('transform/return/iterator ended normally, source return not called', (t) => {
  t.plan(1)

  const returnSpy = spy()
  const it = createIterator([true], returnSpy)

  const result = source(it)
    .pipe(
      transform({
        update: () => ({emit: false, proceed: true, clear: true}),
      }),
    )
    [Symbol.iterator]()

  result.next()

  t.true(returnSpy.notCalled)
})

test('transform/return/return called after iterator ended normally, source return not called', (t) => {
  t.plan(1)

  const returnSpy = spy()
  const it = createIterator([true], returnSpy)

  const result = source(it)
    .pipe(
      transform({
        update: () => ({emit: false, proceed: true, clear: true}),
      }),
    )
    [Symbol.iterator]()

  result.next()
  result.return && result.return()

  t.true(returnSpy.notCalled, 'source return not called')
})

test('transform/return/iterator ended by invoking return, source return called once', (t) => {
  t.plan(1)

  const returnSpy = spy()
  const it = createIterator([true], returnSpy)

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

test('transform/return/invoking finish on return', (t) => {
  t.plan(3)

  const it = createIterator([1, 2, 3, 4])

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
