export function* range({
  start,
  count,
}: {
  start: number
  count: number
}): Iterator<number> {
  for (let i = 0; i < count; i++) {
    yield i + start
  }
}
