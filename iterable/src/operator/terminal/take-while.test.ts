import test from 'tape'

import {source} from '../../pipe'
import {takeWhile} from './take-while'

test('take-while', (t) => {
  t.plan(1)

  const it = [true, true, false, true]
  const result = source(it).pipe(takeWhile((value) => value))

  t.deepEquals(Array.from(result), [true, true])
})
