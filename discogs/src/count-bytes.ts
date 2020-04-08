import {asyncSource, scan} from '@kdraba/iterable'

type ByteCount<T> = Readonly<{chunk: T; byteCount: number}>

export function countBytes<T extends {buffer: Readonly<Buffer>}>(
  it: AsyncIterator<T>,
): AsyncIterator<ByteCount<T>> {
  return asyncSource({[Symbol.asyncIterator]: () => it})
    .pipe(
      scan((agg: ByteCount<T> | undefined, chunk) => ({
        chunk,
        byteCount: (agg?.byteCount || 0) + chunk.buffer.length,
      })),
    )
    [Symbol.asyncIterator]()
}
