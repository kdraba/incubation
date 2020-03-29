export function bufferCount<T>(count: number) {
  return async function*(items: AsyncIterable<T>) {
    let buffer = []

    for await (const item of items) {
      buffer.push(item)
      if (buffer.length % count === 0) {
        yield buffer
        buffer = []
      }
    }

    if (buffer.length > 0) {
      yield buffer
    }
  }
}
