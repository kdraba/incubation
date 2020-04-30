import test from 'tape'

import {createPushablePromise} from './create-pushable-promise'

test('create-pushable-promise', async (t) => {
  t.plan(1)

  const p = createPushablePromise<string>()
  p.push('test')

  const v = await p

  t.equal(v, 'test')
})
