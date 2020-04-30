import {
  asyncSource,
  endWith,
  fork,
  fromMergeAll,
  isDefined,
  isOfType,
  map,
  pluck,
  scan,
  takeWhile,
} from '@kdraba/iterable'

import {Release} from './discogs.type'
import {parseChunk} from './parse-chunk'
import {parseRelease} from './parse-release'
import {states} from './parser-state'

export type ParseReleasesEvent<T> = Readonly<
  | {
      type: 'chunk'
      detail: T
    }
  | {
      type: 'release'
      detail: Readonly<Release>
    }
>

type EndEvent = {type: 'end'}

function isParseReleasesEvent<T>(
  event: ParseReleasesEvent<T> | EndEvent,
): event is ParseReleasesEvent<T> {
  return event.type === 'chunk' || event.type === 'release'
}

export function parseReleasesRegex<T extends Readonly<{text: string}>>({
  start = 0,
  end = Number.MAX_SAFE_INTEGER,
}: {start?: number; end?: number} = {}): (
  it: AsyncIterator<T>,
) => AsyncIterator<ParseReleasesEvent<T>> {
  return (it) => {
    const [forked1, forked2] = fork(it, 2)
    const parsed: AsyncIterator<
      ParseReleasesEvent<T> | EndEvent
    > = asyncSource({[Symbol.asyncIterator]: () => forked1})
      .pipe(
        scan<
          {text: string},
          {text: string | undefined; pos: number},
          {pos: number}
        >(
          ({pos}, {text}) => {
            const d = start - pos

            if (d >= text.length) {
              return {pos: pos + text.length, text: undefined}
            } else if (d < 0) {
              const l = Math.max(0, Math.min(text.length, end - pos))

              return {
                pos: pos + l,
                text: text.slice(0, l),
              }
            } else {
              const l = Math.max(0, Math.min(end - pos - d, text.length - d))

              return {
                pos: pos + d + l,
                text: text.slice(d, d + l),
              }
            }
          },
          {pos: 0},
        ),
      )
      .pipe(takeWhile(({pos}) => pos < end, {inclusive: true}))
      .pipe(map(({text}) => text))
      .pipe(isDefined())
      .pipe(parseChunk(states, 'releases'))
      .pipe(scan(parseRelease, undefined))
      .pipe(isDefined())
      .pipe(
        map(
          ({
            done,
            id,
            startPos,
            endPos,
            title,
            artists,
            released,
            masterId,
            isMainRelease,
            barcodes,
            count,
            eventCount,
          }) =>
            done && id && startPos !== undefined && endPos !== undefined
              ? ({
                  id,

                  masterId,
                  isMainRelease: isMainRelease === 'true',

                  startPos: startPos + start,
                  endPos: endPos + start,
                  ...(title ? {title} : {}),
                  ...(released ? {released} : {}),
                  artists: artists || [],
                  barcodes: barcodes || [],
                  count,
                  eventCount,
                } as Release)
              : undefined,
        ),
      )
      .pipe(isDefined())
      .pipe(
        map(
          (detail) =>
            ({
              type: 'release',
              detail,
            } as const),
        ),
      )
      .pipe(endWith({type: 'end'} as const))
      [Symbol.asyncIterator]()

    const chunks: AsyncIterator<
      ParseReleasesEvent<T> | EndEvent
    > = asyncSource({[Symbol.asyncIterator]: () => forked2})
      .pipe(
        map(
          (detail) =>
            ({
              type: 'chunk',
              detail,
            } as const),
        ),
      )
      [Symbol.asyncIterator]()

    const combined = fromMergeAll([chunks, parsed])
      .pipe(pluck('value'))
      .pipe(takeWhile(({type}) => type !== 'end'))
      .pipe(isOfType(isParseReleasesEvent))
      [Symbol.asyncIterator]()
    return combined
  }
}
