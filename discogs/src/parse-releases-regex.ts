import {transform} from '@kdraba/iterable'
import {
  asyncSource,
  fork,
  fromCombineLatest,
  isDefined,
  isOfType,
  map,
  scan,
} from '@kdraba/iterable'

import {Artist, Release} from './discogs.type'

function isReleaseDefined<T>(
  v: Readonly<{
    chunk?: T
    release?: Readonly<Release>
  }>,
): v is Readonly<{
  chunk: T
  release: Readonly<Release>
}> {
  return !!v.release && !!v.chunk
}

export function parseReleases<T extends Readonly<{text: string}>>(
  it: AsyncIterator<T>,
): AsyncIterator<
  Readonly<{
    chunk: T
    release: Readonly<Release>
  }>
> {
  const [forked1, forked2] = fork(it, 2)
  const parsed = asyncSource({[Symbol.asyncIterator]: () => forked1})
    .pipe(map(({text}) => text))
    .pipe(parse(states, 'releases'))
    .pipe(scan(parseRelease, undefined))
    .pipe(isDefined())
    .pipe(
      map(({done, id, title, artists, released, barcodes, count, eventCount}) =>
        done && id
          ? ({
              id,
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
    [Symbol.asyncIterator]()

  const combined = fromCombineLatest([forked2, parsed])
    .pipe(
      map(({value: [chunk, release]}) => ({
        release,
        chunk,
      })),
    )
    .pipe(isOfType(isReleaseDefined))
    [Symbol.asyncIterator]()
  return combined
}

export type States<TKey extends string | symbol> = {
  [key in TKey]: Readonly<{
    pattern: RegExp
    minLength: number
    next: ReadonlyArray<TKey>
  }>
}

type Events =
  | 'releases'
  | 'releaseStart'
  | 'releaseEnd'
  | 'releaseIdStart'
  | 'releaseIdValue'
  | 'releaseIdEnd'
  | 'releaseIdFull'
  | 'identifiersStart'
  | 'identifiersEnd'
  | 'identifierStart'
  | 'identifierEnd'
  | 'identifierBarcodeType'
  | 'barcodeValueFull'
  | 'barcodeValueStart'
  | 'barcodeValue'
  | 'barcodeValueEnd'
  | 'titleFull'
  | 'titleStart'
  | 'titleValue'
  | 'titleEnd'
  | 'tracklistStart'
  | 'tracklistEnd'
  | 'videosStart'
  | 'videosEnd'
  | 'artistsStart'
  | 'artistsEnd'
  | 'artistStart'
  | 'artistEnd'
  | 'artistIdFull'
  | 'artistIdStart'
  | 'artistIdValue'
  | 'artistIdEnd'
  | 'artistNameFull'
  | 'artistNameStart'
  | 'artistNameValue'
  | 'artistNameEnd'
  | 'releasedFull'
  | 'releasedStart'
  | 'releasedValue'
  | 'releasedEnd'

const releaseChildren: ReadonlyArray<Events> = [
  'titleStart',
  'titleFull',
  'identifiersStart',
  'tracklistStart',
  'videosStart',
  'artistsStart',
  'releasedStart',
  'releaseEnd',
]

const value: ReadonlyArray<Events> = [
  'releaseIdValue',
  'barcodeValue',
  'titleValue',
  'artistIdValue',
  'artistNameValue',
  'releasedValue',
]

const valueStart: ReadonlyArray<Events> = [
  'releaseIdStart',
  'barcodeValueStart',
  'titleStart',
  'artistIdStart',
  'artistNameStart',
  'releasedStart',
]

const states: States<Events> = {
  releases: {
    minLength: 0,
    pattern: /$/,
    next: ['releaseStart'],
  },
  releaseStart: {
    minLength: '<release '.length,
    pattern: /<release\s+/,
    next: ['releaseIdFull', 'releaseIdStart', 'releaseEnd'],
  },
  releaseEnd: {
    minLength: '</release>'.length,
    pattern: /<\/release>/,
    next: ['releaseStart'],
  },
  releaseIdFull: {
    minLength: 'id=""'.length,
    pattern: /id="([^"]*)"/,
    next: releaseChildren,
  },
  releaseIdStart: {
    minLength: 'id="'.length,
    pattern: /id="([^"]*)/,
    next: ['releaseIdEnd', 'releaseIdValue'],
  },
  releaseIdValue: {
    minLength: 1,
    pattern: /^([^"]+)/,
    next: ['releaseIdEnd', 'releaseIdValue'],
  },
  releaseIdEnd: {
    minLength: 1,
    pattern: /^([^"]*)"/,
    next: releaseChildren,
  },

  identifiersStart: {
    minLength: '<identifiers>'.length,
    pattern: /<identifiers>/,
    next: ['identifierStart', 'identifiersEnd'],
  },
  identifiersEnd: {
    minLength: '</identifiers>'.length,
    pattern: /<\/identifiers>/,
    next: releaseChildren,
  },

  identifierStart: {
    minLength: '<identifier '.length,
    pattern: /<identifier\s+/,
    next: ['identifierBarcodeType', 'identifierEnd'],
  },
  identifierEnd: {
    minLength: '/>'.length,
    pattern: /\/>/,
    next: ['identifierStart', 'identifiersEnd'],
  },
  identifierBarcodeType: {
    minLength: 'type="Barcode"'.length,
    pattern: /type="Barcode"/,
    next: ['barcodeValueFull', 'barcodeValueStart', 'identifierEnd'],
  },

  barcodeValueFull: {
    minLength: 'value=""'.length,
    pattern: /value="([^"]*)"/,
    next: ['identifierEnd'],
  },
  barcodeValueStart: {
    minLength: 'value="'.length,
    pattern: /value="([^"]*)/,
    next: ['barcodeValueEnd', 'barcodeValueStart'],
  },
  barcodeValue: {
    minLength: 1,
    pattern: /^([^"]+)/,
    next: ['barcodeValueEnd', 'barcodeValue'],
  },
  barcodeValueEnd: {
    minLength: 1,
    pattern: /^([^"]*)"/,
    next: ['identifierEnd'],
  },

  titleFull: {
    minLength: '<title></title>'.length,
    pattern: /<title>([^<]*)<\/title>/,
    next: releaseChildren,
  },
  titleStart: {
    minLength: '<title>'.length,
    pattern: /<title>([^<]*)/,
    next: ['titleEnd', 'titleValue'],
  },
  titleValue: {
    minLength: 1,
    pattern: /^([^<]+)/,
    next: ['titleEnd', 'titleValue'],
  },
  titleEnd: {
    minLength: '</title>'.length,
    pattern: /^([^<]*)<\/title>/,
    next: releaseChildren,
  },

  tracklistStart: {
    minLength: '<tracklist>'.length,
    pattern: /<tracklist>/,
    next: ['tracklistEnd'],
  },
  tracklistEnd: {
    minLength: '</tracklist>'.length,
    pattern: /<\/tracklist>/,
    next: releaseChildren,
  },

  videosStart: {
    minLength: '<videos>'.length,
    pattern: /<videos>/,
    next: ['videosEnd'],
  },
  videosEnd: {
    minLength: '</videos>'.length,
    pattern: /<\/videos>/,
    next: releaseChildren,
  },

  artistsStart: {
    minLength: '<artists>'.length,
    pattern: /<artists>/,
    next: ['artistStart', 'artistsEnd'],
  },
  artistsEnd: {
    minLength: '</artists>'.length,
    pattern: /<\/artists>/,
    next: releaseChildren,
  },

  artistStart: {
    minLength: '<artist>'.length,
    pattern: /<artist>/,
    next: [
      'artistIdStart',
      'artistIdFull',
      'artistNameStart',
      'artistNameFull',
    ],
  },
  artistEnd: {
    minLength: '</artist>'.length,
    pattern: /<\/artist>/,
    next: ['artistStart', 'artistsEnd'],
  },

  artistIdFull: {
    minLength: '<id></id>'.length,
    pattern: /<id><([^<]*)<\/id>/,
    next: ['artistNameFull', 'artistEnd'],
  },
  artistIdStart: {
    minLength: '<id>'.length,
    pattern: /<id>([^<]*)/,
    next: ['artistIdValue', 'artistIdEnd'],
  },
  artistIdEnd: {
    minLength: '</id>'.length,
    pattern: /^([^<]*)<\/id>/,
    next: ['artistNameFull', 'artistNameStart', 'artistEnd'],
  },
  artistIdValue: {
    minLength: 1,
    pattern: /^([^<]+)/,
    next: ['artistNameFull', 'artistNameStart', 'artistEnd'],
  },

  artistNameFull: {
    minLength: '<name></name>'.length,
    pattern: /<name><([^<]*)<\/name>/,
    next: ['artistIdFull', 'artistIdStart', 'artistEnd'],
  },
  artistNameStart: {
    minLength: '<name>'.length,
    pattern: /<name>([^<]*)/,
    next: ['artistNameValue', 'artistNameEnd'],
  },
  artistNameEnd: {
    minLength: '</name>'.length,
    pattern: /^([^<]*)<\/name>/,
    next: ['artistIdFull', 'artistIdStart', 'artistEnd'],
  },
  artistNameValue: {
    minLength: 1,
    pattern: /^([^<]+)/,
    next: ['artistIdFull', 'artistIdStart', 'artistEnd'],
  },

  releasedFull: {
    minLength: '<released></released>'.length,
    pattern: /<released><([^<]*)<\/released>/,
    next: releaseChildren,
  },
  releasedStart: {
    minLength: '<released>'.length,
    pattern: /<released>([^<]*)/,
    next: ['releasedValue', 'releasedEnd'],
  },
  releasedEnd: {
    minLength: '</released>'.length,
    pattern: /^([^<]*)<\/released>/,
    next: releaseChildren,
  },
  releasedValue: {
    minLength: 1,
    pattern: /^([^<]+)/,
    next: ['releasedValue', 'releasedEnd'],
  },
}

/*
track></tracklist><identifiers><identifier description="Text" type="Barcode" value="40 14235 31600 9"/><identifier description="Scanned" type="Barcode" value="4014235316009"/
*/

/*
<artists><artist><id>85013</id><name>Nutz Unlimited</name><anv></anv><join></join><role></role><tracks></tracks></artist></artists>

<title>Dear Drum</title><la
*/

/*
<tracklist><track><position>A</position><title>Dear Drum (Glove Mix)</title><duration>3:40</duration><extraartists><artist><id>13797</id><name>Tobi Neumann</name><anv></anv><join></join><role>Remix</role><tracks></tracks></artist></extraartists></track><track><position>B1</position><title>Dear Drum (Glove Mix 'Vocal Edit')</title><duration>3:40</duration><extraartists><artist><id>13797</id><name>Tobi Neumann</name><anv></anv><join></join><role>Remix</role><tracks></tracks></artist></extraartists></track><track><position>B2</position><title>Dear Drum (Ascii Disko Mix)</title><duration>6:58</duration><extraartists><artist><id>29900</id><name>Ascii Disko</name><anv></anv><join></join><role>Remix</role><tracks></tracks></artist></extraartists></track></tracklist>
*/

/*y><released>2002-07-28</released>*/

export function parseRelease(
  acc:
    | Readonly<{
        text: string
        artistId?: string
        artistName?: string

        id?: string
        barcodes?: ReadonlyArray<string>
        title?: string
        artists?: ReadonlyArray<Readonly<Artist>>
        released?: string

        count: number
        eventCount: number
      }>
    | undefined,
  event: Readonly<{key: keyof typeof states; match: RegExpExecArray}>,
):
  | Readonly<{
      text: string
      artistId?: string
      artistName?: string

      id?: string
      barcodes?: ReadonlyArray<string>
      title?: string
      artists?: ReadonlyArray<Readonly<Artist>>
      released?: string

      done: boolean

      count: number
      eventCount: number
    }>
  | undefined {
  //console.log(event.key, event.match[1])

  const eventCount = acc ? acc.eventCount + 1 : 1
  const count = acc ? acc.count : 0

  if (valueStart.includes(event.key)) {
    return {
      ...acc,
      done: false,

      text: event.match[1] || '',
      eventCount,
      count,
    }
  } else if (value.includes(event.key)) {
    return {
      ...acc,
      done: false,

      text: (acc?.text || '') + event.match[1] || '',
      eventCount,
      count,
    }
  } else if (
    (event.key === 'releaseIdEnd' || event.key === 'releaseIdFull') &&
    event.match
  ) {
    const id = (acc?.text || '') + event.match[1] || ''

    return {
      ...acc,
      done: false,

      id,

      text: '',
      eventCount,
      count,
    }
  } else if (
    ['barcodeValueEnd', 'barcodeValueFull'].includes(event.key) &&
    event.match
  ) {
    const barcode = ((acc?.text || '') + event.match[1] || '').replace(
      /[^0-9]+/g,
      '',
    )

    return {
      ...acc,
      done: false,

      barcodes: barcode
        ? (acc?.barcodes || []).concat([barcode])
        : acc?.barcodes,

      text: '',
      eventCount,
      count,
    }
  } else if (['titleEnd', 'titleFull'].includes(event.key) && event.match) {
    const title = ((acc?.text || '') + event.match[1] || '').trim()

    return {
      ...acc,
      done: false,

      title,

      text: '',
      eventCount,
      count,
    }
  } else if (
    ['artistIdEnd', 'artistIdFull'].includes(event.key) &&
    event.match
  ) {
    const artistId = ((acc?.text || '') + event.match[1] || '').trim()

    return {
      ...acc,
      done: false,

      artistId,

      text: '',
      eventCount,
      count,
    }
  } else if (
    ['releasedEnd', 'releasedFull'].includes(event.key) &&
    event.match
  ) {
    const released = ((acc?.text || '') + event.match[1] || '').trim()

    return {
      ...acc,
      done: false,

      released,

      text: '',
      eventCount,
      count,
    }
  } else if (
    ['artistNameEnd', 'artistNameFull'].includes(event.key) &&
    event.match
  ) {
    const artistName = ((acc?.text || '') + event.match[1] || '').trim()

    return {
      ...acc,
      done: false,

      artistName,

      text: '',
      eventCount,
      count,
    }
  } else if (event.key === 'artistEnd') {
    const artist = acc?.artistId &&
      acc?.artistName && {
        id: acc.artistId,
        name: acc.artistName,
      }

    return {
      ...acc,
      done: false,

      artists: artist ? (acc?.artists || []).concat([artist]) : acc?.artists,

      artistId: undefined,
      artistName: undefined,
      text: '',
      eventCount,
      count,
    }
  } else if (event.key === 'releaseStart') {
    return {
      done: false,

      text: '',
      eventCount,
      count,
    }
  } else if (event.key === 'releaseEnd') {
    return {
      ...acc,
      done: true,

      barcodes: acc?.barcodes && Array.from(new Set(acc.barcodes).values()),

      text: '',
      eventCount,
      count: count + 1,
    }
  } else {
    return {
      ...acc,
      done: false,

      text: '',
      eventCount,
      count,
    }
  }
}

export function parse<TKey extends string | symbol>(
  states: States<TKey>,
  start: TKey,
) {
  return transform<
    string,
    Readonly<{
      key: TKey
      match: RegExpExecArray
      buffer: string
    }>,
    Readonly<{
      key: TKey
      buffer: string
      proceed: boolean
    }>
  >({
    update: (value, _index, previous) => {
      const state =
        previous.hasValue && previous.value.proceed
          ? {
              buffer: previous.value.buffer + value,
              key: previous.value.key,
            }
          : previous.hasValue && !previous.value.proceed
          ? previous.value
          : {
              buffer: value,
              key: start,
            }

      const {next} = states[state.key]

      const result = matchChunk(states, next, state.buffer)
      const proceed = !result.match

      return result.match
        ? {
            state: {
              key: result.key,
              buffer: result.buffer,
              proceed,
            },
            value: result,
            emit: true,
            clear: false,
            proceed,
          }
        : {
            state: {
              key: state.key,
              buffer: result.buffer,
              proceed,
            },
            emit: false,
            clear: false,
            proceed,
          }
    },
    finish: (state) => {
      const result =
        state.hasValue &&
        matchChunk(states, states[state.value.key].next, state.value.buffer)
      return result && result.match
        ? {
            emit: true,
            value: result,
          }
        : {
            emit: false,
          }
    },
  })
}

function matchChunk<TKey extends string | symbol>(
  states: States<TKey>,
  next: ReadonlyArray<TKey>,
  buffer: string,
):
  | {match: RegExpExecArray; key: TKey; buffer: string}
  | {match: false; buffer: string} {
  const minLength =
    next.reduce(
      (acc: undefined | number, key) =>
        acc === undefined
          ? states[key].minLength
          : Math.min(acc, states[key].minLength),
      undefined,
    ) || 0

  let i = 0
  let match: {key: TKey; result: RegExpExecArray} | false = false

  while (buffer.length >= minLength && i < next.length) {
    const {pattern} = states[next[i]]
    const nextMatch = pattern.exec(buffer) || false
    match =
      nextMatch &&
      (!match ||
        nextMatch.index < match.result.index ||
        (nextMatch.index === match.result.index &&
          nextMatch[1].length > match.result[1].length))
        ? {key: next[i], result: nextMatch}
        : match
    i++
  }

  if (match) {
    return {
      key: match.key,
      buffer: buffer.slice(match.result.index + match.result[0].length),
      match: match.result,
    }
  } else {
    return {
      match: false,
      buffer:
        buffer.length >= minLength
          ? buffer.slice(Math.max(buffer.length - minLength, 0))
          : buffer,
    }
  }
}
