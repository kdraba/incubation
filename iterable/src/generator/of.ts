export function* of<TIn>(value: TIn): IterableIterator<TIn> {
  yield value
}
