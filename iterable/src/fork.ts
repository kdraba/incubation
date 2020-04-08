import {range} from './generator/range'
import {createLastValueBufferStrategy as createBufferStrategy} from './iterator/last-value-buffer-strategy'
import {PushableIterator} from './iterator/pushable-iterator'

async function* createFork<TIn>(
  pushIt: PushableIterator<TIn>,
  addToWaiting: (v: PushableIterator<TIn>) => void,
): AsyncIterableIterator<TIn> {
  let done = false

  while (!done) {
    addToWaiting(pushIt)
    const result = await pushIt.next()
    done = !!result.done

    if (!done) {
      yield result.value
    }
  }
}

export function fork<TIn>(
  iterator: Iterator<TIn> | AsyncIterator<TIn>,
  forks: 1,
): [AsyncIterator<TIn>]
export function fork<TIn>(
  iterator: Iterator<TIn> | AsyncIterator<TIn>,
  forks: 2,
): [AsyncIterator<TIn>, AsyncIterator<TIn>]
export function fork<TIn>(
  iterator: Iterator<TIn> | AsyncIterator<TIn>,
  forks: number,
): ReadonlyArray<AsyncIterator<TIn>> {
  const waiting = new Set<PushableIterator<TIn>>()
  const resolved = new Set<PushableIterator<TIn>>()
  let current: Promise<IteratorResult<TIn>> | undefined
  function addToWaiting(pushIt: PushableIterator<TIn>) {
    current =
      !current || resolved.size >= forks
        ? Promise.resolve(iterator.next())
        : current

    if (resolved.size >= forks) {
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

    if (!resolved.has(pushIt)) {
      current.then((v) => {
        if (!v.done) {
          pushIt.push(v.value)
        } else {
          pushIt.return()
        }
      })
      resolved.add(pushIt)
    } else {
      waiting.add(pushIt)
    }
  }

  return Array.from({
    [Symbol.iterator]: () => range({start: 0, count: forks}),
  }).map(() => {
    const pushIt = new PushableIterator<TIn>(createBufferStrategy())

    return createFork(pushIt, addToWaiting)
  })
}
