import {asyncSource, filter, map, pluck, reduce} from '@kdraba/iterable'
import {splitByNewline} from '@kdraba/iterable-string'
import {close, createReadStream, open} from 'fs'
import {promisify} from 'util'

import {decode} from './decode'
import {Options} from './find-by-barcode.type'

async function readBarcodes(file: string) {
  const fd = await promisify(open)(file, 'r')

  try {
    const result = asyncSource(
      createReadStream('', {fd, autoClose: false, flags: 'r'}),
    )
      .pipe(decode())
      .pipe(pluck('text'))
      .pipe(splitByNewline())
      .pipe(filter((v) => !!v))
      .pipe(
        reduce<string, Set<string>, Set<string>>((acc, s) => {
          const m = s.match(/"([^"]+)"/)
          if (m) {
            acc.add(m[1])
          }
          return acc
        }, new Set<string>()),
      )
      [Symbol.asyncIterator]()
      .next()
    const r = await result
    return r.done ? new Set<string>() : r.value
  } finally {
    await promisify(close)(fd)
  }
}

export async function findByBarcode({releaseFile, barcodeFile}: Options) {
  const barcodes = await readBarcodes(barcodeFile)

  const fd = await promisify(open)(releaseFile, 'r')

  try {
    const it = asyncSource(
      createReadStream('', {fd, autoClose: false, flags: 'r'}),
    )
      .pipe(decode())
      .pipe(pluck('text'))
      .pipe(splitByNewline())
      .pipe(filter((v) => !!v))
      .pipe(parseJson())

    const foundMasterIds = new Set<string>()

    for await (const v of it) {
      if (
        v.barcodes.some((b: string) => barcodes.has(b)) &&
        (!v.masterId || !foundMasterIds.has(v.masterId))
      ) {
        v.masterId && foundMasterIds.add(v.masterId)
        console.log(v)
      }
    }
  } finally {
    await promisify(close)(fd)
  }
}

function parseJson() {
  return map<string, ReturnType<JSON['parse']>>((s) => {
    try {
      return JSON.parse(s)
    } catch (e) {
      throw new Error(
        `Failed to parse text with exception:\n---\n${e}\n---\ntext:\n<${s}>\n`,
      )
    }
  })
}
