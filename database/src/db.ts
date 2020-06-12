import {performance} from 'perf_hooks'
import {StringDecoder} from 'string_decoder'

import {binarySearch} from './binary-search'
import {IndexBuffer} from './index-buffer'

export class Db<TValue, TKey extends string> {
  constructor(
    private readonly index: {[index in TKey]: IndexBuffer},
    private readonly reader: (
      start: number,
      length: number,
    ) => Promise<{buffer: Buffer; bytesRead: number}>,
    private readonly encoding: ConstructorParameters<typeof StringDecoder>[0],
  ) {}

  public size(indexKey: TKey) {
    const b = this.index[indexKey]
    return b.length
  }

  public async *list(
    indexKey: TKey,
    skip = 0,
    limit: number = Number.MAX_SAFE_INTEGER,
  ): AsyncIterableIterator<TValue> {
    const b = this.index[indexKey]
    let i = skip
    let count = 0

    while (count < limit && i < b.length) {
      console.log('list', i, count)

      const {pos, length} = b.read(i)
      const value = await this.readFromBuffer(pos, length)
      if (value !== undefined) {
        yield value
        count++
      }
      i++
    }
  }

  public async read(
    indexKey: TKey,
    key: string,
    offset = 0,
  ): Promise<{index: number; value: TValue} | undefined> {
    const b = this.index[indexKey]

    const startFindPerf = performance.now()
    const index = this.findIndex(b, key)
    const endFindPerf = performance.now() - startFindPerf
    const size = this.size(indexKey)

    console.log(
      `Search for <${key}> at <${index}> in <${size}> took ${endFindPerf})`,
    )

    if (index >= 0 && index < b.length) {
      const startReadPerf = performance.now()
      let result = b.read(index)
      if (result.key === key) {
        const offsetIndex = offset
          ? Math.max(0, Math.min(index + offset, size - 1))
          : index
        result = offsetIndex !== index ? b.read(offsetIndex) : result
        const value = await this.readFromBuffer(result.pos, result.length)
        const r = value && {index: offsetIndex, value}
        const endReadPerf = performance.now() - startReadPerf
        console.log(
          `Read ${result.length} bytes for <${key}> at <${index}> in <${size}> took ${endReadPerf})`,
        )

        return r
      } else {
        console.log(
          'search',
          key,
          'index not found',
          index,
          result.key,
          'left',
          b.read(index - 1).key,
          'right',
          b.read(index + 1).key,
        )
      }
    }

    return undefined
  }

  private async readFromBuffer(
    pos: number,
    length: number,
  ): Promise<TValue | undefined> {
    const {buffer: b} = await this.reader(pos, length)
    const s = new StringDecoder(this.encoding).end(b)

    try {
      return s ? JSON.parse(s) : undefined
    } catch (e) {
      console.error('failed to parse json string', e, s)
      console.error(s)
      throw e
    }
  }

  private findIndex(b: IndexBuffer, key: string) {
    return binarySearch(key, {
      start: 0,
      length: b.length,
      generateKey: (index) => b.read(index).key,
    })
  }
}
