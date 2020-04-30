import {
  CLEAR_EVENT_LISTENERS,
  DISPATCH_EVENT,
  withEventTargetSupport,
} from '@kdraba/event-listener'

export interface BufferStrategy<TIn, TOut = TIn, TState = unknown> {
  push: (state: TState, value: Readonly<TIn>, index: number) => TState
  pop: (
    state: TState,
    index: number,
  ) => Readonly<
    | {
        ready: true
        state: TState
        value: TOut
      }
    | {
        ready: false
      }
  >
  close?: () => void
  initial: TState
}

const DONE = {done: true, value: undefined as any}

async function* loop<TIn, TOut>({
  push,
  pop,
  updatePromise,
  updateDone,
  isClosing,
}: {
  push: (value: TIn) => void
  pop: () => Readonly<
    | {
        ready: true
        value: TOut
      }
    | {
        ready: false
      }
  >
  updatePromise: (
    promise:
      | Readonly<{
          resolve: (value: IteratorResult<TIn>) => void
          reject: (error: any) => void
        }>
      | undefined,
  ) => void
  updateDone: (done: boolean | any) => void
  isClosing: () => boolean
}) {
  let done = false
  try {
    while (!done) {
      //console.log(this.counter, 'await next', this.done)
      const value = await new Promise<IteratorResult<TOut>>(
        (resolve, reject) => {
          if (done) {
            resolve(DONE)
          } else {
            const r = pop()
            if (r.ready) {
              resolve({done: false, value: r.value})
            } else if (!isClosing()) {
              updatePromise({
                resolve: (v) => {
                  if (!v.done) {
                    push(v.value)
                    const r = pop()
                    if (r.ready) {
                      updatePromise(undefined)
                      resolve({done: false, value: r.value})
                    } else {
                      throw new Error('this should not have happened')
                    }
                  } else {
                    resolve(DONE)
                  }
                },
                reject: (e) => {
                  updatePromise(undefined)
                  reject(e)
                },
              })
            } else {
              resolve(DONE)
            }
          }
        },
      )

      if (!value.done) {
        yield value.value
      } else {
        done = true
      }
    }
  } catch (e) {
    done = e || new Error('iteration failed')
  }

  updateDone(done)
}

export class PushableIterator<TIn, TOut = TIn, TState = any>
  extends withEventTargetSupport<new () => {}, {close: never}>(Object)
  implements AsyncIterator<TOut> {
  private promise?: {
    resolve(v: IteratorResult<TIn>): void
    reject(e: any): void
  }
  private readonly it: AsyncIterator<TOut>
  private done: any = false
  private closing = false
  private pushIndex = 0
  private popIndex = 0
  private state: TState

  constructor(
    private readonly bufferStrategy: BufferStrategy<TIn, TOut, TState>,
  ) {
    super()

    this.it = loop({
      push: (value: TIn) => {
        this.state = this.bufferStrategy.push(this.state, value, this.pushIndex)
        this.pushIndex++
      },
      pop: () => {
        const r = this.bufferStrategy.pop(this.state, this.popIndex)
        if (r.ready) {
          this.state = r.state
          this.popIndex++
        }
        return r
      },
      updatePromise: (
        promise:
          | Readonly<{
              resolve: (value: IteratorResult<TIn>) => void
              reject: (error: any) => void
            }>
          | undefined,
      ) => {
        this.promise = promise
      },
      updateDone: (done: boolean | any) => {
        this.done = done
        done && this.close()
      },
      isClosing: () => this.closing,
    })
    this.state = this.bufferStrategy.initial
  }

  push(value: Readonly<TIn>): boolean {
    if (this.closing || this.done) {
      return false
    } else {
      if (this.promise) {
        this.promise.resolve({done: false, value})
      } else {
        this.state = this.bufferStrategy.push(this.state, value, this.pushIndex)
        this.pushIndex++
      }
      return true
    }
  }

  next(): Promise<IteratorResult<TOut>> {
    if (!this.done) {
      return this.it.next()
    } else if (this.done === true) {
      return Promise.resolve(DONE)
    } else {
      return Promise.reject(this.done)
    }
  }

  return(): Promise<IteratorResult<TOut>> {
    if (this.promise) {
      this.it.return && this.it.return()
      this.close()
      this.promise.resolve(DONE)
    } else {
      this.it.return && this.it.return()
      this.close()
    }

    this.done = true
    return Promise.resolve(DONE)
  }

  close(): boolean {
    if (!this.closing) {
      if (this.promise && this.pushIndex <= this.popIndex) {
        this.promise.resolve(DONE)
        this.it.return && this.it.return()
      }

      this.closing = true
      this.bufferStrategy.close && this.bufferStrategy.close()
      this[DISPATCH_EVENT]('close')
      this[CLEAR_EVENT_LISTENERS]()
      return true
    } else {
      return false
    }
  }
}
