import test from 'tape'

import {source} from '../../pipe'
import {defaultValue} from './default-value'

test('default value empty', (t) => {
  t.plan(1)

  const it: any[] = []
  const result = source(it).pipe(defaultValue(true))

  t.deepEquals(Array.from(result), [true])
})

test('default value non empty single value', (t) => {
  t.plan(1)

  const it = [false]
  const result = source(it).pipe(defaultValue(true))

  t.deepEquals(Array.from(result), [false])
})

test('default value non empty multiple values', (t) => {
  t.plan(1)

  const it = [1, 2]
  const result = source(it).pipe(defaultValue(0))

  t.deepEquals(Array.from(result), [1, 2])
})

test('default-value/default value non empty multiple values with initial return', (t) => {
  t.plan(2)

  const inIt = [1, 2]
  const outIt = source(inIt)
    .pipe(defaultValue(42))
    [Symbol.iterator]()

  const result = outIt.return && outIt.return()

  t.true(result?.done, 'iterator is done')
  t.equals(
    result?.value,
    42,
    'returns default value, because no value has been read',
  )
})

test('default-value/default value non empty multiple values with return after first value', (t) => {
  t.plan(2)

  const inIt = [1, 2]
  const outIt = source(inIt)
    .pipe(defaultValue(42))
    [Symbol.iterator]()

  outIt.next()
  const result = outIt.return && outIt.return()

  t.true(result?.done, 'iterator is done')
  t.equals(
    result?.value,
    undefined,
    'returns no value, because the first value has already been read',
  )
})
