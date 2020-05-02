import {asyncSource, map, toArray} from '@kdraba/iterable'
import test from 'tape'

import {Event, InitialWriter} from './json-writer'

async function toResultArray(fn: (w: InitialWriter) => AsyncIterable<Event>) {
  async function* gen() {
    const writer = new InitialWriter()
    yield* fn(writer)
  }

  return (
    await asyncSource(gen())
      .pipe(map(({text}) => text))
      .pipe(toArray())
      [Symbol.asyncIterator]()
      .next()
  ).value
}

test('json-writer/write empty object', async (t) => {
  t.plan(1)

  const result = await toResultArray((w) => w.createObject())

  t.deepEqual(result, ['{', '}'])
})

test('json-writer/write object with simple attributes', async (t) => {
  t.plan(1)

  const stringValue = 'stringValue'
  const numberValue = 1

  const result = await toResultArray((initiaWriter) =>
    initiaWriter.createObject(async function*(objectWriter) {
      yield* objectWriter.addValueAttribute('attr1', stringValue)
      yield* objectWriter.addValueAttribute('attr2', numberValue)
      yield* objectWriter.addValueAttribute('attr3', null)
    }),
  )

  t.deepEqual(result, [
    '{',
    '"',
    'attr1',
    '"',
    ':',
    '"',
    stringValue,
    '"',
    ',',
    '"',
    'attr2',
    '"',
    ':',
    `${numberValue}`,
    ',',
    '"',
    'attr3',
    '"',
    ':',
    `${null}`,
    '}',
  ])
})

test('json-writer/write nested objects', async (t) => {
  t.plan(1)

  const result = await toResultArray((initiaWriter) =>
    initiaWriter.createObject(async function*(objectWriter) {
      yield* objectWriter.addObjectAttribute('attr1')
    }),
  )

  t.deepEqual(result, ['{', '"', 'attr1', '"', ':', '{', '}', '}'])
})

test('json-writer/write empty array', async (t) => {
  t.plan(1)

  const result = await toResultArray((initiaWriter) =>
    initiaWriter.createArray(),
  )

  t.deepEqual(result, ['[', ']'])
})

test('json-writer/write array with simple values', async (t) => {
  t.plan(1)

  const stringValue = 'stringValue'
  const numberValue = 1

  const result = await toResultArray((initiaWriter) =>
    initiaWriter.createArray(async function*(arrayWriter) {
      yield* arrayWriter.addValue(stringValue)
      yield* arrayWriter.addValue(1)
      yield* arrayWriter.addValue(null)
    }),
  )

  t.deepEqual(result, [
    '[',
    '"',
    stringValue,
    '"',
    ',',
    `${numberValue}`,
    ',',
    'null',
    ']',
  ])
})
