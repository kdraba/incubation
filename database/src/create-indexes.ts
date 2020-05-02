import {
  asyncSource,
  concatMap,
  filter,
  map,
  reduce,
  scan,
  source,
} from '@kdraba/iterable'
import {split} from '@kdraba/iterable-string'
import {createReadStream} from 'fs'
import {StringDecoder} from 'string_decoder'

import {binarySearch} from './binary-search'
import {Encoding} from './encoding.type'
import {IndexBuffer} from './index-buffer'
import {KeyBuffer} from './key-buffer'

export async function createIndexesFromFileDescriptor<
  TKey extends string,
  TValue
>(
  fd: number,
  generateKey: {[index in TKey]: (value: TValue) => string},
  delimiter: string,
  encoding: Encoding,
  {
    offset = 0,
    length = Number.POSITIVE_INFINITY,
  }: {offset?: number; length?: number} = {},
) {
  return createIndexes(
    source([fd]).pipe(
      concatMap((fd) =>
        createReadStream('', {
          fd,
          autoClose: false,
          flags: 'r',
          start: offset,
          end: offset + length,
        })[Symbol.asyncIterator](),
      ),
    ),
    generateKey,
    delimiter,
    encoding,
  )
}

export async function createIndexes<TKey extends string, TValue>(
  data: AsyncIterable<Buffer>,
  generateKey: {[index in TKey]: (value: TValue) => string},
  delimiter: string,
  encoding: Encoding,
): Promise<{[index in TKey]: IndexBuffer}> {
  const delimiterLength = Buffer.byteLength(delimiter, encoding)
  const initial = {decoder: new StringDecoder(encoding), text: ''}
  const it = asyncSource(data)
    .pipe(
      scan(
        ({decoder}: {decoder: StringDecoder}, buffer) => ({
          decoder,
          text: decoder.write(buffer),
        }),
        initial,
      ),
    )
    .pipe(map(({text}) => text))
    .pipe(split(delimiter))
    .pipe(
      scan(
        (
          {pos, length, first}: {pos: number; length: number; first: boolean},
          text,
        ) => ({
          pos: first ? pos + length : pos + length + delimiterLength,
          length: Buffer.byteLength(text, encoding),
          text,
          first: false,
        }),
        {pos: 0, length: 0, first: true},
      ),
    )
    .pipe(filter(({text}) => !!(text && text.trim())))
  //.pipe(map(({text}) => JSON.parse(text) as {}))

  const initialResult = mapValues(
    generateKey,
    () =>
      new IndexBuffer(
        Buffer.alloc(0),
        new KeyBuffer(Buffer.alloc(0), encoding),
      ),
  )
  const index = it.pipe(
    reduce(
      (
        buffer: {[index in TKey]: IndexBuffer},
        {text, pos, length}: {text: string; pos: number; length: number},
      ) => {
        //console.log('hiiier', pos, length)
        const v: TValue = JSON.parse(text)
        return mapValues(buffer, (b, k) => {
          const key = generateKey[k](v)

          const offset =
            b.length <= 0
              ? 0
              : binarySearch(key, {
                  start: 0,
                  length: b.length,
                  generateKey: (index) => b.read(index).key,
                })
          /*
        if (offset < b.length && b.read(offset).key.localeCompare(key) < 0) {
          throw new Error(`invalid order (${offset}) ${b.read(offset).key} < ${key} size: ${b.length}`)
        }

        if (b.length > 0 && offset >= b.length && b.read(offset - 1).key.localeCompare(key) > 0) {
          throw new Error(`invalid order (${offset}) ${b.read(offset - 1).key} > ${key} size: ${b.length}`)
        }
*/
          return b.insert(key, offset, pos, length)
        })
      },
      initialResult,
    ),
  )

  /*
  for await (const {pos, length, text} of it) {
    console.log(pos, length, text)
  }

  console.log('start')
  const startMarker = 'start-marker'
  const endMarker = 'end-marker'
  
  performance.mark(startMarker)*/
  for await (const result of index) {
    /*console.log('ready', mapValues(result, (b) => ({index: b.byteLength / 1024, keys: b.keysByteLength / 1024})))
    performance.mark(endMarker)
    performance.measure('index', startMarker, endMarker)*/

    return result
  }

  return initialResult
}

function mapValues<TIn, TOut, TKey extends string>(
  o: {[key in TKey]: TIn},
  fn: (v: TIn, k: TKey) => TOut,
): {[key in TKey]: TOut} {
  const initial: any = {}
  return Object.entries(o).reduce((result, next) => {
    const [key, value]: [TKey, TIn] = next as any
    result[key] = fn(value, key)
    return result
  }, initial)
}
