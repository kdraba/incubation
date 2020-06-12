import {isPromise} from '../../is-promise'
import {createArrayBufferStrategy} from '../../iterator/array-buffer-strategy'
import {PushableIterator} from '../../iterator/pushable-iterator'
import {DONE, DONE_PROMISE, getNextResult, updateState} from './transform-util'
import {
  Config,
  Finish,
  FinishResult,
  IteratorState,
  Next,
  Proceed,
  PromiseOrNot,
  Update,
  UpdateResult,
  Value,
} from './transform.type'

/**
 * @module thing1
 */

export function transform<TIn, TOut = TIn, TState = TOut>(options: {
  update: (
    value: TIn,
    index: number,
    state: Value<TState>,
  ) => UpdateResult<TOut, TState> & Proceed
  finish?: (state: Value<TState>, index: number) => FinishResult<TOut>
  error?: (
    error: any,
    value: TIn,
    index: number,
    state: Value<TState>,
  ) => UpdateResult<TOut, TState> & Proceed
}): /*<T extends AsyncIterator<TIn> | Iterator<TIn>>(
  v: T,
  ) => T extends Iterator<TIn> ? Iterator<TOut> : AsyncIterator<TOut>*/
((v: Iterator<TIn>) => Iterator<TOut>) &
  ((v: AsyncIterator<TIn>) => AsyncIterator<TOut>)

export function transform<TIn, TOut = TIn, TState = TOut>(options: {
  update: (
    value: TIn,
    index: number,
    state: Value<TState>,
  ) => UpdateResult<TOut, TState> & Proceed
  finish?: (state: Value<TState>, index: number) => FinishResult<TOut>
  error?: (
    error: any,
    value: TIn,
    index: number,
    state: Value<TState>,
  ) => Promise<UpdateResult<TOut, TState> & Proceed>
}): (v: Iterator<TIn> | AsyncIterator<TIn>) => AsyncIterator<TOut>
export function transform<TIn, TOut = TIn, TState = TOut>(options: {
  update: (
    value: TIn,
    index: number,
    state: Value<TState>,
  ) => Promise<UpdateResult<TOut, TState> & Proceed>
  finish?: (state: Value<TState>, index: number) => FinishResult<TOut>
  error?: (
    error: any,
    value: TIn,
    index: number,
    state: Value<TState>,
  ) => PromiseOrNot<UpdateResult<TOut, TState> & Proceed>
}): (v: Iterator<TIn> | AsyncIterator<TIn>) => AsyncIterator<TOut>
export function transform<TIn, TOut = TIn, TState = TOut>(options: {
  update: (
    value: TIn,
    index: number,
    state: Value<TState>,
  ) => UpdateResult<TOut, TState> & Proceed
  finish?: (state: Value<TState>, index: number) => Promise<FinishResult<TOut>>
  error?: (
    error: any,
    value: TIn,
    index: number,
    state: Value<TState>,
  ) => PromiseOrNot<UpdateResult<TOut, TState> & Proceed>
}): (v: Iterator<TIn> | AsyncIterator<TIn>) => AsyncIterator<TOut>
export function transform<TIn, TOut = TIn, TState = TOut>(options: {
  update: (
    value: TIn,
    index: number,
    state: Value<TState>,
  ) => Promise<UpdateResult<TOut, TState> & Proceed>
  finish?: (state: Value<TState>, index: number) => Promise<FinishResult<TOut>>
  error?: (
    error: any,
    value: TIn,
    index: number,
    state: Value<TState>,
  ) => PromiseOrNot<UpdateResult<TOut, TState> & Proceed>
}): (v: Iterator<TIn> | AsyncIterator<TIn>) => AsyncIterator<TOut>
export function transform<TIn, TOut, TState>({
  update,
  finish = () => ({emit: false}),
  error = (e) => {
    throw e
  },
}: {
  update: (
    value: TIn,
    index: number,
    state: Value<TState>,
  ) =>
    | (UpdateResult<TOut, TState> & Proceed)
    | Promise<UpdateResult<TOut, TState> & Proceed>
  finish?: (
    state: Value<TState>,
    index: number,
  ) => FinishResult<TOut> | Promise<FinishResult<TOut>>
  error?: (
    error: any,
    value: TIn,
    index: number,
    state: Value<TState>,
  ) => PromiseOrNot<UpdateResult<TOut, TState> & Proceed>
}): any {
  return (it: Iterator<TIn> | AsyncIterator<TIn>) =>
    new TransformIterator(it, {update, finish, error})
}

interface Queue<TIn, TOut, TState> {
  resolve: (r: IteratorResult<TOut>) => void
  reject: (error: any) => void
  next?: PromiseOrNot<(Update<TOut, TState> & Next<TIn>) | Finish<TOut>>
}

class TransformIterator<TIn, TOut, TState> {
  private readonly queue = new PushableIterator<
    Readonly<Queue<TIn, TOut, TState>>
  >(createArrayBufferStrategy())
  private isAsync = false
  private state: Readonly<IteratorState<TIn, TState>> = {
    index: 0,
    state: {hasValue: false},
    proceed: true,
  }

  constructor(
    private readonly iterator: Iterator<TIn> | AsyncIterator<TIn>,
    private readonly config: Config<TIn, TOut, TState>,
  ) {}

  private async run() {
    let done = false

    while (!done) {
      const nextInQueue = await this.queue.next()
      done = !!nextInQueue.done
      if (!nextInQueue.done) {
        const {resolve, reject, next: queueNext} = nextInQueue.value

        let first = true
        let state = this.state
        let emit = false
        while (!emit && state.proceed !== 'done') {
          try {
            const next =
              (first && queueNext) ||
              getNextResult(this.iterator, this.config, state, (it) =>
                it.next(),
              )
            first = false

            const result = isPromise(next) ? await next : next
            emit = !!result.emit
            state =
              result.done || result.proceed
                ? updateState(result)
                : updateState({...result, next: result.next})

            if (result && result.emit) {
              resolve(result.emit)
            }
          } catch (e) {
            reject(e)
          }
        }

        if (state.proceed === 'done') {
          this.queue.return()
        }

        this.state = state
      }
    }

    this.iterator.return && this.iterator.return()
  }

  return() {
    if (this.state.proceed !== 'done') {
      const v =
        this.config.finish &&
        this.config.finish(this.state.state, this.state.index)

      this.iterator.return && this.iterator.return()
      this.queue.return()

      return v && isPromise(v)
        ? v.then((r) => (r.emit ? {done: true, value: r.value} : DONE))
        : v && v.emit && this.isAsync
        ? Promise.resolve({done: true, value: v.value})
        : v && v.emit && !this.isAsync
        ? {done: true, value: v.value}
        : this.isAsync
        ? DONE_PROMISE
        : DONE
    } else {
      return this.isAsync ? DONE_PROMISE : DONE
    }
  }

  next(): PromiseOrNot<IteratorResult<TOut>> {
    if (this.isAsync && this.state.proceed === 'done') {
      return DONE_PROMISE
    } else if (this.isAsync && this.state.proceed !== 'done') {
      return new Promise((resolve, reject) =>
        this.queue.push({resolve: (v) => resolve(v), reject: (e) => reject(e)}),
      )
    } else if (this.state.proceed === 'done') {
      return DONE
    } else {
      let emit: PromiseOrNot<IteratorResult<TOut>> | false = false

      let state: Readonly<IteratorState<TIn, TState>> = this.state
      while (!this.isAsync && !emit && state.proceed !== 'done') {
        const next: PromiseOrNot<
          (Update<TOut, TState> & Next<TIn>) | Finish<TOut>
        > = getNextResult(this.iterator, this.config, state, (it) => {
          return it.next()
        })

        if (isPromise(next)) {
          this.run()
          this.isAsync = true
          emit = new Promise((resolve, reject) =>
            this.queue.push({resolve, reject, next}),
          )
        } else {
          emit = next.emit
          state =
            next.done || next.proceed
              ? updateState(next)
              : updateState({...next, next: next.next})
        }
      }

      this.state = state

      if (!emit || (!isPromise(emit) && emit.done)) {
        this.queue.return()
        this.iterator.return && this.iterator.return()
      }
      return emit || DONE
    }
  }
}
