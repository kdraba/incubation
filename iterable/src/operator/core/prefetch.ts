//import {createLastValueBufferStrategy as createBufferStrategy} from './iterator/last-value-buffer-strategy'
//import {PushableIterator} from './iterator/pushable-iterator'

export function prefetch<TIn>(
  size: number,
): (v: Iterator<TIn> | AsyncIterator<TIn>) => AsyncIterator<TIn> {
  return (it) => {
    const buffer: Array<Promise<IteratorResult<TIn>>> = []

    return {
      next: () => {
        const result = buffer.shift() || Promise.resolve(it.next())

        while (buffer.length < size) {
          buffer[buffer.length] = (buffer.length === 0
            ? result
            : buffer[buffer.length - 1]
          ).then(() => it.next())
        }

        return result
      },
    }
  }
}
