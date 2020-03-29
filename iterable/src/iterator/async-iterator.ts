import {isPromise} from '../is-promise'

export function asyncIterator<T>(
  it: Iterator<T> | AsyncIterator<T>,
): AsyncIterator<T> {
  return {
    next: () => {
      const r = it.next()
      return isPromise(r) ? r : Promise.resolve(r)
    },
    return: () => {
      const r =
        (it.return && it.return()) || ({done: true} as IteratorResult<T>)
      return isPromise(r) ? r : Promise.resolve(r)
    },
  }
}
