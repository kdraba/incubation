import {
  AsyncBuilder,
  asyncSource,
  distinctUntilChanged,
  filter,
  fork,
  fromCombineLatest,
  isDefined,
  map,
  prefetch,
  scan,
  //tap,
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
import {parseReleases} from './parse-releases-regex'

const file =
  '/data/data/com.termux/files/home/storage/external-1/media/discogs_20200220_releases.xml.gz'
const outfile =
  '/data/data/com.termux/files/home/storage/external-1/media/discogs_20200220_releases.json'

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

function releases<TBuffer extends Buffer>(): (
  it: AsyncIterator<TBuffer>,
) => AsyncIterator<{release: Release; byteCount: number}> {
  return (it: AsyncIterator<TBuffer>) =>
    asyncSource({[Symbol.asyncIterator]: () => it})
      .pipe(unzippedWithByteCount)
      .pipe(parseReleases)
      .pipe(
        map(({chunk, release}) => ({
          ...chunk,
          byteCount: chunk?.byteCount || 0,
          release,
        })),
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

async function start() {
  const fd = await promisify(open)(file, 'r')
  const writeFd = await promisify(open)(outfile, 'w')
  console.log(`${outfile}`)

  try {
    const {size} = await promisify(fstat)(fd)
    console.log(`${file} size: ${formatSize(size)}`)
    const out = createWriteStream('', {fd: writeFd})

    const readIt = readFile(fd)[Symbol.asyncIterator]()

    const forks = fork(readIt, 2)
    const combined = fromCombineLatest([
      releases()(forks[0]),
      progress(size)(forks[1]),
    ])[Symbol.asyncIterator]()
    const fork2 = fork(combined, 2)

    const writeDone = writeFile(
      asyncSource({[Symbol.asyncIterator]: () => fork2[0]})
        .pipe(filter(({index}) => index === 0))
        .pipe(map(({value}) => value[0]))
        .pipe(isDefined())
        [Symbol.asyncIterator](),
      out,
    )
    const logStatsDone = logStats(
      asyncSource({[Symbol.asyncIterator]: () => fork2[1]})
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

    await Promise.all([logStatsDone, writeDone])
    console.log('done')
  } finally {
    await promisify(close)(fd)
    await promisify(close)(writeFd)
    console.log('fd closed')
  }
}

start()
