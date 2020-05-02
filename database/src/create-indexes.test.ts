import {fromPromise} from '@kdraba/iterable'
import test from 'tape'

import {createIndexes} from './create-indexes'

async function createIndexesFromObjects<TKey extends string, TValue>(
  data: TValue[],
  generateKey: {[index in TKey]: (value: TValue) => string},
) {
  const delimiter = '\n'
  const encoding = 'utf8'
  const delimiterLength = Buffer.byteLength(delimiter, encoding)
  const lines = data.map((v) => JSON.stringify(v))
  const indexes = await createIndexes(
    fromPromise(Promise.resolve(Buffer.from(lines.join(delimiter), encoding))),
    generateKey,
    delimiter,
    encoding,
  )

  const initial: Array<{text: string; pos: number; length: number}> = []
  return {
    indexes,
    lines: lines.reduce((result, line) => {
      const length = Buffer.byteLength(line, 'utf8')

      if (result.length > 0) {
        const {pos: prevPos, length: prevLength} = result[result.length - 1]
        result.push({
          text: line,
          pos: prevPos + prevLength + delimiterLength,
          length,
        })
      } else {
        result.push({text: line, pos: 0, length})
      }
      return result
    }, initial),
  }
}

test('create-indexes: no index', async (t) => {
  t.plan(1)

  const values = [{id: 0}]
  const {indexes} = await createIndexesFromObjects(values, {})

  t.deepEquals(indexes, {})
})

test('create-indexes: no data', async (t) => {
  t.plan(1)

  const values: Array<{id: number}> = []
  const {indexes} = await createIndexesFromObjects(values, {
    id: (v) => `${v.id}`,
  })

  t.equals(indexes.id.length, 0)
})

test('create-indexes: single item', async (t) => {
  t.plan(2)

  const values = [{id: 0}]
  const {indexes, lines} = await createIndexesFromObjects(values, {
    id: (v) => `${v.id}`,
  })

  t.equals(indexes.id.length, 1)
  t.deepEquals(indexes.id.read(0), {
    key: '0',
    pos: lines[0].pos,
    length: lines[0].length,
  })
})

test('create-indexes: two items sorted', async (t) => {
  t.plan(3)

  const values = [{id: 0}, {id: 1}]
  const {indexes, lines} = await createIndexesFromObjects(values, {
    id: (v) => `${v.id}`,
  })

  t.equals(indexes.id.length, 2)
  t.deepEquals(indexes.id.read(0), {
    key: '0',
    pos: lines[0].pos,
    length: lines[0].length,
  })
  t.deepEquals(indexes.id.read(1), {
    key: '1',
    pos: lines[1].pos,
    length: lines[1].length,
  })
})

test('create-indexes: two items unsorted', async (t) => {
  t.plan(3)

  const values = [{id: 1}, {id: 0}]
  const {indexes, lines} = await createIndexesFromObjects(values, {
    id: (v) => `${v.id}`,
  })

  t.equals(indexes.id.length, 2)
  t.deepEquals(indexes.id.read(0), {
    key: '0',
    pos: lines[1].pos,
    length: lines[1].length,
  })
  t.deepEquals(indexes.id.read(1), {
    key: '1',
    pos: lines[0].pos,
    length: lines[0].length,
  })
})

test('create-indexes: three items sorted', async (t) => {
  t.plan(4)

  const values = [{id: 0}, {id: 1}, {id: 2}]
  const {indexes, lines} = await createIndexesFromObjects(values, {
    id: (v) => `${v.id}`,
  })

  t.equals(indexes.id.length, 3)
  t.deepEquals(indexes.id.read(0), {
    key: '0',
    pos: lines[0].pos,
    length: lines[0].length,
  })
  t.deepEquals(indexes.id.read(1), {
    key: '1',
    pos: lines[1].pos,
    length: lines[1].length,
  })
  t.deepEquals(indexes.id.read(2), {
    key: '2',
    pos: lines[2].pos,
    length: lines[2].length,
  })
})

test('create-indexes: three items unsorted - insert last at center', async (t) => {
  t.plan(4)

  const values = [{id: 'b'}, {id: 0}, {id: 'a'}]
  const {indexes, lines} = await createIndexesFromObjects(values, {
    id: (v) => `${v.id}`,
  })

  t.equals(indexes.id.length, 3)
  t.deepEquals(indexes.id.read(0), {
    key: '0',
    pos: lines[1].pos,
    length: lines[1].length,
  })
  t.deepEquals(indexes.id.read(1), {
    key: 'a',
    pos: lines[2].pos,
    length: lines[2].length,
  })
  t.deepEquals(indexes.id.read(2), {
    key: 'b',
    pos: lines[0].pos,
    length: lines[0].length,
  })
})

test('create-indexes: three items unsorted - insert last at start', async (t) => {
  t.plan(4)

  const values = [{id: 'b'}, {id: 'a'}, {id: 0}]
  const {indexes, lines} = await createIndexesFromObjects(values, {
    id: (v) => `${v.id}`,
  })

  t.equals(indexes.id.length, 3)
  t.deepEquals(indexes.id.read(0), {
    key: '0',
    pos: lines[2].pos,
    length: lines[2].length,
  })
  t.deepEquals(indexes.id.read(1), {
    key: 'a',
    pos: lines[1].pos,
    length: lines[1].length,
  })
  t.deepEquals(indexes.id.read(2), {
    key: 'b',
    pos: lines[0].pos,
    length: lines[0].length,
  })
})

test('create-indexes: three items unsorted - insert last at end', async (t) => {
  t.plan(4)

  const values = [{id: 'a'}, {id: 0}, {id: 'b'}]
  const {indexes, lines} = await createIndexesFromObjects(values, {
    id: (v) => `${v.id}`,
  })

  t.equals(indexes.id.length, 3)
  t.deepEquals(indexes.id.read(0), {
    key: '0',
    pos: lines[1].pos,
    length: lines[1].length,
  })
  t.deepEquals(indexes.id.read(1), {
    key: 'a',
    pos: lines[0].pos,
    length: lines[0].length,
  })
  t.deepEquals(indexes.id.read(2), {
    key: 'b',
    pos: lines[2].pos,
    length: lines[2].length,
  })
})
