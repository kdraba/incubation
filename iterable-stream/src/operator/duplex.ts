import {Readable, Writable} from 'stream'

export function duplex<TIn = Readonly<Buffer>, TOut = TIn>(
  duplex: Readable & Writable,
): (v: AsyncIterator<TIn>) => AsyncIterator<TOut> {
  return (it: AsyncIterator<TIn>) => {
    return Readable.from({[Symbol.asyncIterator]: () => it})
      .pipe(duplex)
      [Symbol.asyncIterator]()
  }
}
