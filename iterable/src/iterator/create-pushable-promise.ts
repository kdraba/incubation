import {createLastValueBufferStrategy} from './last-value-buffer-strategy'
import {PushableIterator} from './pushable-iterator'

export function createPushablePromise<T>() {
  const it = new PushableIterator(createLastValueBufferStrategy())
  const p = it.next().then((v) => {
    if (!v.done) {
      return v.value
    } else {
      throw new Error('promise ended without value')
    }
  })
  return {
    then: p.then.bind(p),
    catch: p.catch.bind(p),
    push(v: T) {
      const r = it.push(v)
      it.close()
      return r
    },
  }
}
