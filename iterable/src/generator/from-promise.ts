export async function* fromPromise<TIn>(
  value: Promise<TIn>,
): AsyncIterableIterator<TIn> {
  yield value
}
