import test from 'tape'

import {getNextResult} from './transform-util'
import {
  Finish,
  Next,
  Proceed,
  Update,
  UpdateResult,
  Value,
} from './transform.type'

test('transform/getNextResult', (t) => {
  t.plan(3)

  const update = (
    value: number,
    _index: number,
    state: Value<number>,
  ): UpdateResult<number, number> & Proceed => {
    return state.hasValue && state.value > 1
      ? {emit: false, proceed: true, clear: true}
      : {
          emit: true,
          proceed: false,
          value,
          clear: false,
          state: ((state.hasValue && state.value) || 0) + 1,
        }
  }
  const finish = () => ({emit: false} as const)
  const error = (e: any) => {
    throw e
  }

  const iterator1 = [][Symbol.iterator]()
  const params1 = {
    index: 0,
    state: {hasValue: true, value: 1},
    proceed: false,
    next: {done: false, value: 1},
  } as const
  const result1 = getNextResult(
    iterator1,
    {update, finish, error},
    params1,
    (it) => {
      return it.next()
    },
  )
  const expected1: Update<number, number> & Next<number> = {
    done: false,
    index: 1,
    proceed: false,
    next: {done: false, value: 1},
    state: {hasValue: true, value: 2},
    emit: {done: false, value: 1},
  }

  t.deepEquals(result1, expected1)

  const iterator2 = [2][Symbol.iterator]()
  const params2 = {index: 1, state: {hasValue: false}, proceed: true} as const
  const result2 = getNextResult(
    iterator2,
    {update, finish, error},
    params2,
    (it) => it.next(),
  )
  const expected2: Update<number, number> & Next<number> = {
    done: false,
    index: 2,
    proceed: false,
    next: {done: false, value: 2},
    state: {hasValue: true, value: 1},
    emit: {done: false, value: 2},
  }

  t.deepEquals(result2, expected2)

  const iterator3 = [][Symbol.iterator]()
  const params3 = {
    index: 1,
    state: {hasValue: true, value: 2},
    proceed: true,
  } as const
  const result3 = getNextResult(
    iterator3,
    {update, finish, error},
    params3,
    (it) => it.next(),
  )
  const expected3: Finish<any> = {
    done: true,
    emit: {done: true} as IteratorResult<any>,
  }

  t.deepEquals(result3, expected3)
})
