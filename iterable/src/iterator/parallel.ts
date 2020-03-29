export async function* parallel<TIn>(
  promises: Promise<TIn>[],
): AsyncIterator<TIn> {
  const unresolved = new Set<Promise<TIn>>()
  promises.forEach((promise) => {
    const wrappedPromise = promise.then((result) => {
      unresolved.delete(wrappedPromise)
      return result
    })
    unresolved.add(wrappedPromise)
  })

  while (unresolved.size > 0) {
    yield await Promise.race(unresolved.values())
  }
}
