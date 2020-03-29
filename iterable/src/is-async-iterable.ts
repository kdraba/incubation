export function isAsyncIterable<T>(
  it: AsyncIterator<T> | AsyncIterable<T>,
): it is AsyncIterable<T> {
  return (
    typeof (it as {[Symbol.asyncIterator]?: unknown})[Symbol.asyncIterator] ===
    'function'
  )
}
