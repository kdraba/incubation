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

//let counter = 0

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
        //console.log(this.counter, 'yield')
      } else {
        //console.log(this.counter, 'done now')
        done = true
      }
    }
    //console.log(this.counter, 'done')
  } catch (e) {
    //console.log(this.counter, 'error', e)
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
  //private readonly counter: number

  constructor(
    private readonly bufferStrategy: BufferStrategy<TIn, TOut, TState>,
  ) {
    super()
    //this.counter = counter++

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
    //console.log(this.counter, 'return', this.promise)

    if (this.promise) {
      this.it.return && this.it.return()

      //console.log(this.counter, 'close', this.closing)
      this.close()

      //console.log(this.counter, 'resolve done')
      this.promise.resolve(DONE)
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

      //console.log(this.counter, 'closing')
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

/*
type State<TState> =
  | {
      type: 'open' | 'closing'
      state: TState
    }
  | {
      type: 'closed'
    }

const DONE = {done: true, value: undefined as any}

export class PushableIterator<TIn, TOut = TIn, TState = any>
  extends withEventTargetSupport<new () => {}, {close: never}>(Object)
  implements AsyncIterator<TOut> {
  private state: Readonly<State<TState>>
  private resolveWaiting?: (value: IteratorResult<TOut>) => void
  private previous: Promise<unknown> = Promise.resolve()
  private pushIndex = 0
  private popIndex = 0

  constructor(
    private readonly bufferStrategy: BufferStrategy<TIn, TOut, TState>,
  ) {
    super()
    this.state = {
      type: 'open',
      state: bufferStrategy.initial,
    }
  }

  push(value: Readonly<TIn>): boolean {
    if (this.state.type === 'open') {
      this.state = {
        type: this.state.type,
        state: this.bufferStrategy.push(
          this.state.state,
          value,
          this.pushIndex,
        ),
      }
      this.pushIndex++

      if (this.resolveWaiting) {
        const r = this.bufferStrategy.pop(this.state.state, this.popIndex)
        this.popIndex++

        if (r.ready) {
          this.state = {
            type: this.state.type,
            state: r.state,
          }
          const resolve = this.resolveWaiting
          this.resolveWaiting = undefined
          resolve({
            done: false,
            value: r.value,
          })
        }
      }

      return true
    } else {
      return false
    }
  }

  next(): Promise<IteratorResult<TOut>> {
    //if (!state.closed) {
    const next = this.previous.then(() => {
      if (this.state.type !== 'closed') {
        const r = this.bufferStrategy.pop(this.state.state, this.popIndex)
        this.popIndex++

        if (r.ready) {
          this.state = {
            type: this.state.type,
            state: r.state,
          }
          return {
            done: false,
            value: r.value,
          }
        } else if (this.state.type !== 'closing') {
          return new Promise<IteratorResult<TOut>>((resolve) => {
            this.resolveWaiting = resolve
          })
        } else {
          this.state = {
            type: 'closed',
          }
          return DONE
        }
      } else {
        return DONE
      }
    })
    this.previous = next
    return next
    //} else {
    //  return Promise.resolve(DONE)
    //}
  }

  close(): boolean {
    if (this.state.type === 'open') {
      if (this.resolveWaiting) {
        this.state = {type: 'closed'}
        this.previous = Promise.resolve()
        const resolve = this.resolveWaiting
        this.resolveWaiting = undefined
        resolve(DONE)
      } else {
        this.state = {state: this.state.state, type: 'closing'}
      }

      this.bufferStrategy.close && this.bufferStrategy.close()
      this[DISPATCH_EVENT]('close')
      this[CLEAR_EVENT_LISTENERS]()
      return true
    } else {
      return false
    }
  }

  return(): Promise<IteratorResult<TOut>> {
    this.close()
    return Promise.resolve(DONE)
  }
}
*/
