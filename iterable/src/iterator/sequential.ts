export async function* sequential<TIn>(
  promises: Promise<TIn>[],
): AsyncIterator<TIn> {
  for (const promise of promises) {
    yield await promise
  }
}
