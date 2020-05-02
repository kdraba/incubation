import test from 'tape'

import {IndexBuffer} from './index-buffer'
import {KeyBuffer} from './key-buffer'

test('index-buffer: single item', (t) => {
  t.plan(1)

  const value = {key: 'a', pos: 1, length: 2}

  const indexBuffer = new IndexBuffer(
    Buffer.alloc(0),
    new KeyBuffer(Buffer.alloc(0), 'utf8'),
  ).insert(value.key, 0, value.pos, value.length)

  t.deepEquals(indexBuffer.read(0), value)
})

test('index-buffer: prepend item', (t) => {
  t.plan(2)

  const value1 = {key: 'b', pos: 1, length: 2}
  const value2 = {key: 'a', pos: 3, length: 4}

  const indexBuffer = new IndexBuffer(
    Buffer.alloc(0),
    new KeyBuffer(Buffer.alloc(0), 'utf8'),
  )
    .insert(value1.key, 0, value1.pos, value1.length)
    .insert(value2.key, -1, value2.pos, value2.length)

  t.deepEquals(indexBuffer.read(0), value2)
  t.deepEquals(indexBuffer.read(1), value1)
})

test('index-buffer: append item', (t) => {
  t.plan(2)

  const value1 = {key: 'a', pos: 1, length: 2}
  const value2 = {key: 'b', pos: 3, length: 4}

  const indexBuffer = new IndexBuffer(
    Buffer.alloc(0),
    new KeyBuffer(Buffer.alloc(0), 'utf8'),
  )
    .insert(value1.key, 0, value1.pos, value1.length)
    .insert(value2.key, 0, value2.pos, value2.length)

  t.deepEquals(indexBuffer.read(0), value1)
  t.deepEquals(indexBuffer.read(1), value2)
})

test('index-buffer: insert item', (t) => {
  t.plan(3)

  const value1 = {key: 'a', pos: 1, length: 2}
  const value2 = {key: 'b', pos: 3, length: 4}
  const value3 = {key: 'c', pos: 5, length: 6}

  const indexBuffer = new IndexBuffer(
    Buffer.alloc(0),
    new KeyBuffer(Buffer.alloc(0), 'utf8'),
  )
    .insert(value1.key, 0, value1.pos, value1.length)
    .insert(value3.key, 0, value3.pos, value3.length)
    .insert(value2.key, 0, value2.pos, value2.length)

  t.deepEquals(indexBuffer.read(0), value1)
  t.deepEquals(indexBuffer.read(1), value2)
  t.deepEquals(indexBuffer.read(2), value3)
})
