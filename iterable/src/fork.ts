import {range} from './generator/range'
import {createLastValueBufferStrategy as createBufferStrategy} from './iterator/last-value-buffer-strategy'
import {PushableIterator} from './iterator/pushable-iterator'

async function* createFork<TIn>(
  pushIt: PushableIterator<TIn>,
  addToWaiting: (v: PushableIterator<TIn>) => void,
  closed: (v: PushableIterator<TIn>) => void,
): AsyncIterableIterator<TIn> {
  let done = false

  while (!done) {
    addToWaiting(pushIt)

    const result = await pushIt.next()
    done = !!result.done

    if (!done) {
      yield result.value
    } else {
      closed(pushIt)
      addToWaiting(pushIt)
    }
  }
}

export function fork<TIn>(
  iterator: Iterator<TIn> | AsyncIterator<TIn>,
  forks: 1,
): [AsyncIterator<TIn> & {return(): Promise<IteratorResult<TIn>>}]
export function fork<TIn>(
  iterator: Iterator<TIn> | AsyncIterator<TIn>,
  forks: 2,
): [
  AsyncIterator<TIn> & {return(): Promise<IteratorResult<TIn>>},
  AsyncIterator<TIn> & {return(): Promise<IteratorResult<TIn>>},
]
export function fork<TIn>(
  iterator: Iterator<TIn> | AsyncIterator<TIn>,
  forks: 3,
): [
  AsyncIterator<TIn> & {return(): Promise<IteratorResult<TIn>>},
  AsyncIterator<TIn> & {return(): Promise<IteratorResult<TIn>>},
  AsyncIterator<TIn> & {return(): Promise<IteratorResult<TIn>>},
]
export function fork<TIn>(
  iterator: Iterator<TIn> | AsyncIterator<TIn>,
  forks: number,
): ReadonlyArray<
  AsyncIterator<TIn> & {return(): Promise<IteratorResult<TIn>>}
> {
  const waiting = new Set<PushableIterator<TIn>>()
  const resolved = new Set<PushableIterator<TIn>>()
  const open = new Set<PushableIterator<TIn>>()
  let current: Promise<IteratorResult<TIn>> | undefined
  function addToWaiting(pushIt: PushableIterator<TIn>) {
    current =
      !current || resolved.size >= open.size
        ? Promise.resolve(iterator.next())
        : current

    if (resolved.size >= open.size) {
      resolved.clear()

      for (const w of waiting.values()) {
        current.then((v) => {
          if (!v.done) {
            w.push(v.value)
          } else {
            w.return()
          }
        })
        resolved.add(w)
      }

      waiting.clear()
    }

    if (open.has(pushIt) && !resolved.has(pushIt)) {
      current.then((v) => {
        if (!v.done) {
          pushIt.push(v.value)
        } else {
          pushIt.return()
        }
      })
      resolved.add(pushIt)
    } else if (open.has(pushIt)) {
      waiting.add(pushIt)
    }
  }

  return Array.from({
    [Symbol.iterator]: () => range({start: 0, count: forks}),
  }).map(() => {
    const pushIt = new PushableIterator<TIn>(createBufferStrategy())
    open.add(pushIt)

    const f = createFork(pushIt, addToWaiting, (it) => open.delete(it))
    return {
      next() {
        return f.next()
      },
      return() {
        const r = pushIt.return()

        open.delete(pushIt)
        addToWaiting(pushIt)

        return r
      },
    }
  })
}
