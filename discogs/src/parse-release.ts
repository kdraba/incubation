import {Artist} from './discogs.type'
import {states, value, valueStart} from './parser-state'

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

        masterId?: string
        isMainRelease?: string

        pos: number
        startPos?: number
        endPos?: number

        count: number
        eventCount: number
      }>
    | undefined,

  event: Readonly<{
    key: keyof typeof states
    match: RegExpExecArray
    pos: number
  }>,
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

      masterId?: string
      isMainRelease?: string

      done: boolean

      pos: number
      startPos?: number
      endPos?: number

      count: number
      eventCount: number
    }>
  | undefined {
  const eventCount = acc ? acc.eventCount + 1 : 1
  const count = acc ? acc.count : 0

  const startPos: number = (acc?.pos || 0) + event.pos + event.match.index
  const endPos: number = startPos + (event.match[0]?.length || 0)

  if (valueStart.includes(event.key)) {
    return {
      ...acc,
      done: false,

      text: event.match[1] || '',

      pos: endPos,

      eventCount,
      count,
    }
  } else if (value.includes(event.key)) {
    return {
      ...acc,
      done: false,

      text: (acc?.text || '') + event.match[1] || '',

      pos: endPos,

      eventCount,
      count,
    }
  } else if (event.key === 'masterIdEnd' && event.match) {
    const masterId = (acc?.text || '') + event.match[1] || ''

    return {
      ...acc,
      done: false,

      masterId,

      text: '',

      pos: endPos,

      eventCount,
      count,
    }
  } else if (event.key === 'isMainReleaseEnd' && event.match) {
    const isMainRelease = (acc?.text || '') + event.match[1] || ''

    return {
      ...acc,
      done: false,

      isMainRelease,

      text: '',

      pos: endPos,

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

      pos: endPos,

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

      pos: endPos,

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

      pos: endPos,

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

      pos: endPos,

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

      pos: endPos,

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

      pos: endPos,

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

      pos: endPos,

      eventCount,
      count,
    }
  } else if (event.key === 'releaseStart') {
    return {
      done: false,

      text: '',

      pos: endPos,
      startPos: startPos,

      eventCount,
      count,
    }
  } else if (event.key === 'releaseEnd') {
    return {
      ...acc,
      done: true,

      barcodes: acc?.barcodes && Array.from(new Set(acc.barcodes).values()),

      text: '',

      pos: endPos,
      endPos: endPos,

      eventCount,
      count: count + 1,
    }
  } else {
    return {
      ...acc,
      done: false,

      text: '',

      pos: endPos,

      eventCount,
      count,
    }
  }
}
