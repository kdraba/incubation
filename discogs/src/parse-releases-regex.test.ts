import {
  asyncIterable,
  asyncSource,
  defaultValue,
  isOfType,
  pick,
  pluck,
  toArray,
} from '@kdraba/iterable'
import {SinonSpy, spy} from 'sinon'
import test, {Test} from 'tape'

import {Release} from './discogs.type'
import {ParseReleasesEvent, parseReleasesRegex} from './parse-releases-regex'

interface TestCase {
  description: string
  chunks: Iterable<string>
  start?: number
  end?: number
  expected: (
    chunks: Iterable<string>,
  ) => ReadonlyArray<Pick<Release, 'id' | 'startPos' | 'endPos'>>
  verifyPlan?: number
  verify?: (t: Test, v: {nextSpy: SinonSpy}) => void
}

const testCases: TestCase[] = [
  {
    description: 'empty',
    chunks: [''],
    expected: () => [],
  },
  {
    description: 'release only',
    chunks: ['<release id="1"></release>'],
    expected: () => [
      {
        id: '1',
        startPos: 0,
        endPos: '<release id="1"></release>'.length,
      },
    ],
  },
  {
    description: 'multiple releases',
    chunks: [
      '<release id="1"></release>',
      '<release id="2"></release>',
      '<release id="3"></release>',
    ],
    expected: () => [
      {
        id: '1',
        startPos: 0,
        endPos: '<release id="1"></release>'.length,
      },
      {
        id: '2',
        startPos: '<release id="1"></release>'.length,
        endPos: '<release id="1"></release>'.length * 2,
      },
      {
        id: '3',
        startPos: '<release id="1"></release>'.length * 2,
        endPos: '<release id="1"></release>'.length * 3,
      },
    ],
  },
  {
    description: 'release only - multiple chunks',
    chunks: ['<relea', 'se id="', '1"></r', 'eleas', 'e>'],
    expected: (chunks) => [
      {
        id: '1',
        startPos: 0,
        endPos: Array.from(chunks).join('').length,
      },
    ],
  },
  {
    description: 'start at start of chunk and end at end of chunk',
    chunks: {
      [Symbol.iterator]: () => {
        let counter = 1
        return {
          next: () => ({
            done: false,
            value: `<release id="${counter++}"></release>`,
          }),
        }
      },
    },
    start: '<release id="1"></release>'.length,
    end: '<release id="1"></release><release id="2"></release>'.length,
    expected: () => [
      {
        id: '2',
        startPos: '<release id="1"></release>'.length,
        endPos: '<release id="1"></release><release id="2"></release>'.length,
      },
    ],
  },
  {
    description: 'start in middle of chunk and end at end of chunk',
    chunks: [
      '<release id="1"></release><release id',
      '="2"></release>',
      '<release id="3"></release>',
    ],
    start: '<release id="1"></release>'.length,
    end: '<release id="1"></release><release id="2"></release>'.length,
    expected: () => [
      {
        id: '2',
        startPos: '<release id="1"></release>'.length,
        endPos: '<release id="1"></release><release id="2"></release>'.length,
      },
    ],
  },
  {
    description: 'start at start of chunk and end at end of chunk',
    chunks: [
      '<release id="1"></release>',
      '<release ',
      'id="2"></release><release id="3"></release>',
    ],
    start: '<release id="1"></release>'.length,
    end: '<release id="1"></release><release id="2"></release>'.length,
    expected: () => [
      {
        id: '2',
        startPos: '<release id="1"></release>'.length,
        endPos: '<release id="1"></release><release id="2"></release>'.length,
      },
    ],
  },
]

function runTestCase({
  description,
  chunks,
  start,
  end,
  expected,
  verifyPlan,
  verify,
}: Readonly<TestCase>) {
  test(`parse-releases-regex/${description}`, async (t) => {
    t.plan(1 + (verifyPlan || 0))

    const it: Iterator<string> = chunks[Symbol.iterator]()
    const nextSpy = spy(() => {
      const r = it.next()
      return r.done ? r : {done: false, value: {text: r.value}}
    })

    const resultIt = asyncSource(
      asyncIterable({[Symbol.iterator]: () => ({next: nextSpy})}),
    )
      .pipe(parseReleasesRegex({start, end}))
      .pipe(
        isOfType(
          ((event) => event.type === 'release') as (
            v: ParseReleasesEvent<unknown>,
          ) => v is Readonly<{type: 'release'; detail: Readonly<Release>}>,
        ),
      )
      .pipe(pluck('detail'))
      .pipe(pick(['id', 'startPos', 'endPos']))
      .pipe(toArray())
      .pipe(defaultValue([]))
    const result = await resultIt[Symbol.asyncIterator]().next()

    t.deepEqual(result.value, expected(chunks))
    if (verify) {
      verify(t, {nextSpy})
    }
  })
}

function runTestCases(testCases: ReadonlyArray<Readonly<TestCase>>) {
  for (const testCase of testCases) {
    runTestCase(testCase)
  }
}

runTestCases(testCases)
