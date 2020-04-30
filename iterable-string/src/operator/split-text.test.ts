import {source} from '@kdraba/iterable'
import test from 'tape'

import {split} from './split-text'

test('split test', (t) => {
  t.plan(1)

  const it = ['a']
  const result = source(it).pipe(split(':'))

  t.deepEquals(Array.from(result), ['a'])
})

test('split test', (t) => {
  t.plan(1)

  const it = ['a:b']
  const result = source(it).pipe(split(':'))

  t.deepEquals(Array.from(result), ['a', 'b'])
})

test('split test', (t) => {
  t.plan(1)

  const it = ['a', 'b']
  const result = source(it).pipe(split(':'))

  t.deepEquals(Array.from(result), ['ab'])
})

test('split test', (t) => {
  t.plan(1)

  const it = [':']
  const result = source(it).pipe(split(':'))

  t.deepEquals(Array.from(result), ['', ''])
})

test('split test', (t) => {
  t.plan(1)

  const it = ['a', 'b:c:d', 'e:', ':f', ':']
  const result = source(it).pipe(split(':'))

  t.deepEquals(Array.from(result), ['ab', 'c', 'de', '', 'f', ''])
})
