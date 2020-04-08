import {createArrayBufferStrategy} from '../../iterator/array-buffer-strategy'
import {asyncIterator} from '../../iterator/async-iterator'
import {createLastValueBufferStrategy} from '../../iterator/last-value-buffer-strategy'
import {PushableIterator} from '../../iterator/pushable-iterator'
import {asyncSource} from '../../pipe'
import {HigherOrderAsync, HigherOrderSync} from './higher-order.type'
import {map} from './map'

async function* readClose<TIn>(
  open: Set<AsyncIterator<TIn>>,
  close: PushableIterator<AsyncIterator<TIn>>,
): AsyncGenerator<void> {
  let done = false

  while (!done) {
    const r = await close.next()
    done = r.done || false
    !r.done && open.delete(r.value)

    yield
  }
}

async function* readInitial<TIn>(
  initial: AsyncIterator<IndexedValue<AsyncIterator<TIn>>>,
  open: Set<AsyncIterator<TIn>>,
  idle: PushableIterator<IndexedValue<AsyncIterator<TIn>>>,
): AsyncGenerator<void> {
  let done = false
  while (!done) {
    const r = await initial.next()
    done = r.done || false

    if (!r.done) {
      open.add(r.value.value)
      idle.push(r.value)
    }

    yield
  }
}

async function loopPromise<TIn>(
  idle: PushableIterator<IndexedValue<AsyncIterator<TIn>>>,
  close: PushableIterator<AsyncIterator<TIn>>,
  writeToBuffer: (v: IndexedValue<TIn>) => void,
  {
    getDone,
    setDone,
  }: {getDone: () => boolean; setDone: (done: boolean) => void},
  promise: {
    resolve: () => void
    reject: (error: any) => void
  },
) {
  //count++
  //console.log('unresolved', count, unfinished)
  let p:
    | {
        resolve: () => void
        reject: (error: any) => void
      }
    | undefined = promise

  try {
    while (!getDone() && p) {
      const it = await idle.next()

      setDone(it.done || false)

      if (!it.done) {
        //unfinished++
        it.value.value
          .next()
          .then((v) => {
            //unfinished--
            if (!v.done) {
              //valueResolved || count--

              writeToBuffer({
                value: v.value,
                index: it.value.index,
              })
              //console.log('push to idle')
              p && p.resolve()
              p = undefined
              idle.push(it.value)
            } else {
              p && p.resolve()
              p = undefined
              close.push(it.value.value)
            }
          })
          .catch((e) => {
            p && p.reject(e)
            p = undefined
          })
      }
    }

    p && p.resolve()
  } catch (e) {
    setDone(true)
    p && p.reject(e)
  }
}

async function* readIdle<TIn>(
  idle: PushableIterator<IndexedValue<AsyncIterator<TIn>>>,
  close: PushableIterator<AsyncIterator<TIn>>,
  writeToBuffer: (v: IndexedValue<TIn>) => void,
): AsyncGenerator<void> {
  let done = false
  //  let count = 0
  //  let unfinished = 0

  while (!done) {
    await new Promise((resolve, reject) => {
      loopPromise(
        idle,
        close,
        writeToBuffer,
        {getDone: () => done, setDone: (d: boolean) => (done = d)},
        {resolve, reject},
      )
    })

    yield
  }
}

async function* x<TIn>(
  initial: AsyncIterator<IndexedValue<AsyncIterator<TIn>>>,
  idle: PushableIterator<IndexedValue<AsyncIterator<TIn>>>,
  open: Set<AsyncIterator<TIn>>,
  close: PushableIterator<AsyncIterator<TIn>>,
) {
  let done = false

  const bufferStrategy = createArrayBufferStrategy<IndexedValue<TIn>>()
  let bufferState = bufferStrategy.initial

  let popIndex = 0
  let pushIndex = 0

  const closeIt = readClose(open, close)
  let closeItDone = false
  let closeItNext: Promise<unknown> | undefined

  const initialIt = readInitial(initial, open, idle)
  let initialItDone = false
  let initialItNext: Promise<unknown> | undefined

  const idleIt = readIdle(idle, close, (value) => {
    bufferState = bufferStrategy.push(bufferState, value, pushIndex++)
    //console.log('push bufferSize', bufferState.length, pushIndex, popIndex)
    loopIt.push()
  })
  let idleItDone = false
  let idleItNext: Promise<unknown> | undefined

  const loopIt = new PushableIterator<void>(
    createLastValueBufferStrategy<void>(),
  )

  while (!done) {
    const bufferedValue = bufferStrategy.pop(bufferState, popIndex)

    if (bufferedValue.ready) {
      popIndex++
      bufferState = bufferedValue.state
      //console.log('pop bufferSize', bufferState.length, pushIndex, popIndex)
      yield bufferedValue.value
    } else {
      closeItNext =
        closeItNext ||
        (!closeItDone &&
          closeIt.next().then((v) => {
            closeItDone = v.done || false
            closeItNext = undefined
            loopIt.push()
          })) ||
        undefined

      initialItNext =
        initialItNext ||
        (!initialItDone &&
          initialIt.next().then((v) => {
            initialItDone = v.done || false
            initialItNext = undefined
            loopIt.push()
          })) ||
        undefined

      idleItNext =
        idleItNext ||
        (!idleItDone &&
          idleIt.next().then((v) => {
            idleItDone = v.done || false
            idleItNext = undefined
            loopIt.push()
          })) ||
        undefined
      /*
      const promises = [
        ...(initialItNext ? [initialItNext] : []),
        ...(idleItNext ? [idleItNext] : []),
        ...(closeItNext ? [closeItNext] : []),
      ]
*/
      done = initialItDone && open.size <= 0
      //!done && (await Promise.race(promises))

      if (!done) {
        done = !!(await loopIt.next()).done
      }
    }

    done && loopIt.return()
  }
}

export type IndexedValue<TIn> = {readonly value: TIn; readonly index: number}

function toIndexedAsyncIterator<TIn>(
  it: Iterator<TIn> | AsyncIterator<TIn>,
  index: number,
): IndexedValue<AsyncIterator<TIn>> {
  return {
    index,
    value: asyncIterator(it),
  }
}

function toAsyncIteratorOfIndexedAsyncIterators<TIn>(
  it:
    | Iterator<Iterator<TIn> | AsyncIterator<TIn>>
    | AsyncIterator<Iterator<TIn> | AsyncIterator<TIn>>,
): AsyncIterator<IndexedValue<AsyncIterator<TIn>>> {
  return asyncSource({
    [Symbol.asyncIterator]: () => asyncIterator(it),
  })
    .pipe(map(toIndexedAsyncIterator))
    [Symbol.asyncIterator]()
}

class MergeAllIterator<TIn> {
  private readonly iterators: AsyncIterator<IndexedValue<AsyncIterator<TIn>>>
  private readonly idle: PushableIterator<
    IndexedValue<AsyncIterator<TIn>>
  > = new PushableIterator(createArrayBufferStrategy())
  private readonly close: PushableIterator<
    AsyncIterator<TIn>
  > = new PushableIterator(createArrayBufferStrategy())
  private readonly open: Set<AsyncIterator<TIn>> = new Set()
  private readonly iterator: AsyncIterator<IndexedValue<TIn>>

  constructor(
    iterators:
      | Iterator<Iterator<TIn> | AsyncIterator<TIn>>
      | AsyncIterator<Iterator<TIn> | AsyncIterator<TIn>>,
  ) {
    this.iterators = toAsyncIteratorOfIndexedAsyncIterators(iterators)
    this.iterator = x(this.iterators, this.idle, this.open, this.close)
  }

  async next(): Promise<IteratorResult<IndexedValue<TIn>>> {
    const r = await this.iterator.next()

    if (r.done) {
      this.return()
    }

    return r
  }

  return(): Promise<IteratorResult<IndexedValue<TIn>>> {
    this.iterators.return && this.iterators.return()
    this.idle.return()
    this.close.return()
    this.open.clear()

    return Promise.resolve({done: true} as IteratorResult<IndexedValue<TIn>>)
  }
}

export function mergeAll<TIn>(): <
  T extends HigherOrderAsync<TIn> | HigherOrderSync<TIn>
>(
  it: T,
) => AsyncIterator<IndexedValue<TIn>> {
  return (it) => new MergeAllIterator(it)
}
