import {asyncIterator} from './async-iterator'

export function asyncIterable<T>(it: Iterable<T>): AsyncIterable<T> {
  return {
    [Symbol.asyncIterator]: () => asyncIterator(it[Symbol.iterator]()),
  }
}
