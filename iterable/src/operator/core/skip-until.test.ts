import test from 'tape'

import {source} from '../../pipe'
import {skipUntil} from './skip-until'

test('skip-until', (t) => {
  t.plan(1)

  const it = [false, false, true, false]
  const result = source(it).pipe(skipUntil((value) => value))

  t.deepEquals(Array.from(result), [true, false])
})
