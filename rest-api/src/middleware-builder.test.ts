import test from 'tape'

import {createMiddlewareBuilder} from './middleware-builder'

test('middleware-builder', async (t) => {
  t.plan(1)

  const result: {a?: number; b?: number; c?: number} = {}
  const mw1 = async (v: {a: number}, fn: (v: {b: number}) => Promise<void>) => {
    result.a = v.a
    await fn({b: 2})
  }
  const mw2 = async (v: {b: number}, fn: (v: {c: number}) => Promise<void>) => {
    result.b = v.b
    await fn({c: 3})
  }

  const b = createMiddlewareBuilder(mw1)
    .add(mw2)
    .create((v: {c: number}) => {
      result.c = v.c
      return Promise.resolve()
    })

  b({a: 1})
  t.deepEquals(result, {a: 1, b: 2, c: 3})
})
