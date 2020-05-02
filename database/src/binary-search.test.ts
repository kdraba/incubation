import test from 'tape'

import {binarySearch} from './binary-search'

function executeBinarySearch(value: string, data: unknown[]) {
  return binarySearch(value, {
    start: 0,
    length: data.length,
    generateKey: (i: number) => `${data[i]}`,
  })
}

test('binary search: insert before first', (t) => {
  t.plan(1)

  const data = [1]
  const index = executeBinarySearch('0', data)

  t.equal(index, -1)
})

test('binary search: insert after last', (t) => {
  t.plan(1)

  const data = [0]
  const index = executeBinarySearch('1', data)

  t.equal(index, 0)
})

test('binary search: insert after last', (t) => {
  t.plan(1)

  const data = [0, 1, 2]
  const index = executeBinarySearch('9', data)

  t.equal(index, 2)
})

test('binary search: insert in between', (t) => {
  t.plan(1)

  const data = [0, 2]
  const index = executeBinarySearch('1', data)

  t.equal(index, 0)
})

test('binary search: insert in between', (t) => {
  t.plan(1)

  const data = [0, 1, 2, 3, 5]
  const index = executeBinarySearch('4', data)

  t.equal(index, 3)
})

test('binary search: insert existing value', (t) => {
  t.plan(1)

  const data = [0, 1, 3]
  const index = executeBinarySearch('1', data)

  t.equal(index, 1)
})

test('binary search: insert existing value', (t) => {
  t.plan(1)

  const data = [0, 1, 1, 3]
  const index = executeBinarySearch('1', data)

  t.equal(index, 2)
})
