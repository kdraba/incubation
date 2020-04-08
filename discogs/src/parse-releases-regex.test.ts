import {asyncIterable, asyncSource, map, toArray} from '@kdraba/iterable'
import test from 'tape'

import {parseReleases} from './parse-releases-regex'

test('parse-releases-regex', async (t) => {
  t.plan(1)

  const it: Iterable<{text: string}> = []

  const resultIt = asyncSource(asyncIterable(it))
    .pipe(parseReleases)
    .pipe(toArray())
  const result = await resultIt[Symbol.asyncIterator]().next()

  t.ok(result.done)
})

test('parse-releases-regex', async (t) => {
  t.plan(1)

  const it: Iterable<{text: string}> = [{text: '<release id="1"></release>'}]

  const resultIt = asyncSource(asyncIterable(it))
    .pipe(parseReleases)
    .pipe(
      map(({release: {id, artists, barcodes}}) => ({id, artists, barcodes})),
    )
    .pipe(toArray())
  const result = await resultIt[Symbol.asyncIterator]().next()

  t.deepEqual(result.value, [{id: '1', artists: [], barcodes: []}])
})
