export function toAsyncIterator<TOut>(
  iterator: Iterator<TOut>,
): AsyncIterator<TOut> {
  return {next: () => Promise.resolve(iterator.next())}
}

export function empty(): Iterator<never> {
  return {next: () => ({done: true, value: undefined as never})}
}
