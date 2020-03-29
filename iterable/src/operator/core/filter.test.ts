import test from 'tape'

import {source} from '../../pipe'
import {filter} from './filter'

test('filter test', (t) => {
  t.plan(1)

  const it = [true, false, true]
  const result = source(it).pipe(filter((value) => value))

  t.deepEquals(Array.from(result), [true, true])
})
