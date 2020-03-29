export type PromiseOrNot<T> = T | Promise<T>

export type Value<TValue> = Readonly<
  {hasValue: false} | {hasValue: true; value: TValue}
>
type Emit<TValue> = Readonly<{emit: false} | {emit: true; value: TValue}>

type State<TValue> = Readonly<{clear: true} | {clear: false; state: TValue}>

export type UpdateResult<TOut, TState> = Emit<TOut> & State<TState> & Proceed

export type FinishResult<TOut> = Readonly<
  {value: TOut; emit: true} | {emit: false}
>

export type Update<TOut, TState> = {
  done: false
  emit: IteratorResult<TOut> | false
  state: Value<TState>
  index: number
}

export type Finish<TOut> = {
  done: true
  emit: IteratorResult<TOut>
}

export type Proceed = {proceed: boolean | 'finish'}

export type Next<TIn> =
  | {proceed: true | 'finish'}
  | {proceed: false; next: IteratorResult<TIn>}

export interface Config<TIn, TOut, TState> {
  readonly update: (
    value: TIn,
    index: number,
    state: Value<TState>,
  ) =>
    | (UpdateResult<TOut, TState> & Proceed)
    | Promise<UpdateResult<TOut, TState> & Proceed>
  readonly finish: (
    state: Value<TState>,
    index: number,
  ) => FinishResult<TOut> | Promise<FinishResult<TOut>>
  readonly error: (
    error: any,
    value: TIn,
    index: number,
    state: Value<TState>,
  ) => PromiseOrNot<UpdateResult<TOut, TState> & Proceed>
}

export type IteratorState<TIn, TState> =
  | {proceed: 'finish' | true; index: number; state: Value<TState>}
  | {
      proceed: false
      index: number
      state: Value<TState>
      next: IteratorResult<TIn>
    }
  | {proceed: 'done'}
