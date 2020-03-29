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

export function fork<TIn, TOut>(
  iterator: Iterator<TIn> | AsyncIterator<TIn>,
  forks: readonly [(v: AsyncIterator<TIn>) => AsyncIterator<TOut>],
): [AsyncIterator<TOut>]
export function fork<TIn, TOut1, TOut2>(
  iterator: Iterator<TIn> | AsyncIterator<TIn>,
  forks: readonly [
    (v: AsyncIterator<TIn>) => AsyncIterator<TOut1>,
    (v: AsyncIterator<TIn>) => AsyncIterator<TOut2>,
  ],
): [AsyncIterator<TOut1>, AsyncIterator<TOut2>]
export function fork<TIn, TFork>(
  iterator: Iterator<TIn> | AsyncIterator<TIn>,
  forks: ReadonlyArray<(v: AsyncIterator<TIn>) => AsyncIterator<TFork>>,
): ReadonlyArray<AsyncIterator<TFork>> {
  const waiting = new Set<PushableIterator<TIn>>()
  const resolved = new Set<PushableIterator<TIn>>()
  let current: Promise<IteratorResult<TIn>> | undefined
  function addToWaiting(pushIt: PushableIterator<TIn>) {
    current =
      !current || resolved.size >= forks.length
        ? Promise.resolve(iterator.next())
        : current

    if (resolved.size >= forks.length) {
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

  return forks.map((fork) => {
    const pushIt = new PushableIterator<TIn>(createBufferStrategy())

    const forkIt = createFork(pushIt, addToWaiting)
    return fork(forkIt)
  })
}
