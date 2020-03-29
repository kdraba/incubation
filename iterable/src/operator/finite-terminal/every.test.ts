import test from 'tape'

import {source} from '../../pipe'
import {every} from './every'

test('every test empty', (t) => {
  t.plan(1)

  const it: any[] = []
  const result = source(it).pipe(every((value: boolean) => value))

  t.deepEquals(Array.from(result), [true])
})

test('every test false', (t) => {
  t.plan(1)

  const it = [true, false, true][Symbol.iterator]()
  const result = source(it).pipe(every((value: boolean) => value))

  t.deepEquals(Array.from(result), [false])
})

test('every test true', (t) => {
  t.plan(1)

  const it = [true, true, true][Symbol.iterator]()
  const result = source(it).pipe(every((value: boolean) => value))

  t.deepEquals(Array.from(result), [true])
})
