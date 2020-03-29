import {isAsyncIterable} from './is-async-iterable'

export function withAsyncIterator<T, TResult>(
  iteratorOrIterable: AsyncIterator<T> | AsyncIterable<T>,
  fn: (it: AsyncIterator<T>) => TResult,
): TResult {
  const {it, close} = isAsyncIterable(iteratorOrIterable)
    ? {it: iteratorOrIterable[Symbol.asyncIterator](), close: true}
    : {it: iteratorOrIterable, close: true}
  try {
    return fn(it)
  } finally {
    close && it.return && it.return()
  }
}
