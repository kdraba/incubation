import {
  AsyncBuilder,
  asyncSource,
  distinctUntilChanged,
  filter,
  fork,
  fromCombineLatest,
  isDefined,
  isOfType,
  map,
  prefetch,
  scan,
} from '@kdraba/iterable'
import {duplex} from '@kdraba/iterable-stream'
import {close, createReadStream, createWriteStream, fstat, open} from 'fs'
import {performance} from 'perf_hooks'
import {Writable} from 'stream'
import {StringDecoder} from 'string_decoder'
import {promisify} from 'util'
import {createGunzip} from 'zlib'

import {countBytes} from './count-bytes'
import {Release, Stats} from './discogs.type'
import {formatSize} from './format-size'
import {formatTime} from './format-time'
import {ParseReleasesEvent, parseReleasesRegex} from './parse-releases-regex'
import {Options} from './parse-releases.type'

const gunzip = createGunzip()
const PROGRESS_PRECISION = 100

function zippedWithByteCount<TBuffer extends Readonly<Buffer>>(
  v: AsyncIterator<TBuffer>,
): AsyncIterator<{buffer: TBuffer; byteCount: number}> {
  return asyncSource({[Symbol.asyncIterator]: () => v})
    .pipe(map((buffer) => ({buffer})))
    .pipe(countBytes)
    .pipe(map(({chunk, byteCount}) => ({...chunk, byteCount})))
    [Symbol.asyncIterator]()
}

function unzippedWithByteCount<TBuffer extends Buffer>(
  v: AsyncIterator<TBuffer>,
): AsyncIterator<{buffer: TBuffer; byteCount: number; text: string}> {
  return asyncSource({[Symbol.asyncIterator]: () => v})
    .pipe(duplex(gunzip))
    .pipe(
      scan<
        TBuffer,
        {buffer: TBuffer; decoder: StringDecoder; text: string},
        {decoder: StringDecoder}
      >(
        ({decoder}, buffer) => ({
          buffer,
          decoder,
          text: decoder.write(buffer),
        }),
        {
          decoder: new StringDecoder('utf8'),
        },
      ),
    )
    .pipe(countBytes)
    .pipe(map(({chunk, byteCount}) => ({...chunk, byteCount})))
    [Symbol.asyncIterator]()
}

function stats(
  size: number,
): (v: AsyncIterator<number>) => AsyncIterator<Stats> {
  const start = performance.now()

  return (v) =>
    asyncSource({[Symbol.asyncIterator]: () => v})
      .pipe(
        map((byteCount) => ({
          progress: Math.floor(
            ((byteCount || 0) / size) * 100 * PROGRESS_PRECISION,
          ),
          byteCount,
        })),
      )
      .pipe(filter(({progress}) => !!progress))
      .pipe(
        distinctUntilChanged(
          ({progress: progress1}, {progress: progress2}) =>
            progress1 === progress2,
        ),
      )
      .pipe(
        map(({progress, byteCount}) => {
          const duration = performance.now() - start
          const complete = (duration / (progress / PROGRESS_PRECISION)) * 100
          const estimate = complete - duration

          return {
            progress,
            byteCount,
            size,
            duration,
            estimate,
            eta: Date.now() + estimate,
            memoryUsage: process.memoryUsage(),
          }
        }),
      )
      [Symbol.asyncIterator]()
}

function readFile(fd: number): AsyncBuilder<Buffer> {
  return asyncSource(
    createReadStream('', {fd, autoClose: false, flags: 'r'}),
  ).pipe(prefetch(10))
}

async function writeFile<
  TRelease extends Readonly<{release: Readonly<Release>}>
>(v: AsyncIterator<TRelease>, out: Writable): Promise<void> {
  for await (const {release} of {[Symbol.asyncIterator]: () => v}) {
    const json = JSON.stringify(release)
    await promisify(out.write.bind(out))(json)
    await promisify(out.write.bind(out))('\n')
  }
}

async function awaitExit<
  TRelease extends Readonly<{release: Readonly<Release>}>
>(v: AsyncIterator<TRelease>, startPos: number): Promise<void> {
  let endPos = 0
  process.on('exit', () =>
    console.log(
      `exited: last release end pos ${
        endPos > startPos ? endPos + 1 : startPos
      }`,
    ),
  )
  process.on('SIGINT', () => process.exit(0))
  process.on('SIGTERM', () => process.exit(0))

  for await (const {release} of {[Symbol.asyncIterator]: () => v}) {
    endPos = release.endPos
  }
}

async function logStats<
  TStats extends Readonly<
    Stats & {
      count: number
      eventCount: number
      unzippedByteCount: number
    }
  >
>(stats: AsyncIterator<TStats>): Promise<void> {
  for await (const stat of {[Symbol.asyncIterator]: () => stats}) {
    console.log(stat)
    const etaString =
      stat.eta &&
      new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(stat.eta)

    console.log(
      `${stat.progress / 100}% ${formatTime(
        stat.duration,
      )} eta: ${etaString} (${formatTime(stat.estimate)})
size: ${formatSize(stat.byteCount)}/${formatSize(
        stat.size,
      )} (unzipped: ${formatSize(stat.unzippedByteCount)})
releases: ${stat.count} (events: ${stat.eventCount})
rss: ${formatSize(stat.memoryUsage.rss)}
heapTotal: ${formatSize(stat.memoryUsage.heapTotal)}
heapUsed: ${formatSize(stat.memoryUsage.heapUsed)}
external: ${formatSize(stat.memoryUsage.external)}`,
    )
  }
}

export function releases<TBuffer extends Buffer>(
  options: Readonly<{start: number; end: number}>,
): (
  it: AsyncIterator<TBuffer>,
) => AsyncIterator<{release: Release; byteCount: number}> {
  return (it: AsyncIterator<TBuffer>) =>
    asyncSource({[Symbol.asyncIterator]: () => it})
      .pipe(unzippedWithByteCount)
      //.pipe(tap(({buffer}) => process.stdout.write(buffer)))
      .pipe(parseReleasesRegex(options))
      .pipe(
        scan<
          ParseReleasesEvent<{byteCount: number}>,
          {release?: Release; byteCount: number},
          {byteCount: number}
        >(
          ({byteCount}, event) =>
            event.type === 'release'
              ? {byteCount, release: event.detail}
              : {byteCount: event.detail.byteCount},
          {byteCount: 0},
        ),
      )
      .pipe(
        isOfType(
          ((v) => !!v.release) as (v: {
            byteCount: number
            release?: Release
          }) => v is {byteCount: number; release: Release},
        ),
      )
      .pipe(
        distinctUntilChanged(
          ({release}, {release: prevRelease}) => release === prevRelease,
        ),
      )
      [Symbol.asyncIterator]()
}

function progress<TBuffer extends Readonly<Buffer>>(
  size: number,
): (it: AsyncIterator<TBuffer>) => AsyncIterator<Stats> {
  return (it: AsyncIterator<TBuffer>) =>
    asyncSource({[Symbol.asyncIterator]: () => it})
      .pipe(zippedWithByteCount)
      .pipe(map(({byteCount}) => byteCount))
      .pipe(stats(size))
      [Symbol.asyncIterator]()
}

export async function parseReleases(options: Readonly<Options>) {
  const {file, outFile} = options
  const fd = await promisify(open)(file, 'r')
  const writeFd = await promisify(open)(outFile, 'w')
  console.log(`${outFile}`)

  try {
    const {size} = await promisify(fstat)(fd)
    console.log(`${file} size: ${formatSize(size)}`)
    const out = createWriteStream('', {fd: writeFd})

    const readIt = readFile(fd)[Symbol.asyncIterator]()

    const readItForks = fork(readIt, 2)
    const releasesForks = fork(releases(options)(readItForks[0]), 3)
    const combined = fromCombineLatest([
      releasesForks[0],
      progress(size)(readItForks[1]),
    ])[Symbol.asyncIterator]()

    const exitDone = awaitExit(releasesForks[1], options.start)
    const writeDone = writeFile(releasesForks[2], out)
    const logStatsDone = logStats(
      asyncSource({[Symbol.asyncIterator]: () => combined})
        .pipe(filter(({index}) => index === 1))
        .pipe(
          map(
            ({value: [release, progress]}) =>
              progress && {
                count: release ? release.release.count : 0,
                eventCount: release ? release.release.eventCount : 0,
                unzippedByteCount: release ? release.byteCount : 0,
                ...progress,
              },
          ),
        )
        .pipe(isDefined())
        [Symbol.asyncIterator](),
    )

    await Promise.all([logStatsDone, writeDone, exitDone])
    console.log('done')
  } finally {
    await promisify(close)(fd)
    await promisify(close)(writeFd)
    console.log('fd closed')
  }
}
