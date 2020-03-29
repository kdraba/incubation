/**
 * @module thing1
 */

export type Value<TValue> = Readonly<
  {hasValue: false} | {hasValue: true; value: TValue}
>
type Emit<TValue> = Readonly<{emit: false} | {emit: true; value: TValue}>
type State<TValue> = Readonly<{clear: true} | {clear: false; state: TValue}>

export type UpdateResult<TOut, TState> = Emit<TOut> & State<TState>
export type FinishResult<TOut> = Readonly<
  {value: TOut; emit: true} | {emit: false}
>

export type Proceed = {proceed: boolean | 'finish'}
export type Next<TIn> =
  | {proceed: true | 'finish'}
  | {proceed: false; next: IteratorResult<TIn> | Promise<IteratorResult<TIn>>}

const DONE: IteratorResult<any> = {done: true} as IteratorResult<any>

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
}): <T extends AsyncIterator<TIn> | Iterator<TIn>>(
  v: T,
) => typeof v extends Iterator<TIn> ? Iterator<TOut> : AsyncIterator<TOut>
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
  return function invoke(
    iterator: Iterator<TIn> | AsyncIterator<TIn>,
  ): Iterator<TOut> | AsyncIterator<TOut> {
    let v: PromiseOrNot<RNext<TIn, TOut, TState>> | undefined

    return {
      return() {
        if (v && isPromise(v)) {
          v = v.then((x) => {
            if (x.done) {
              return x
            } else {
              return getNextResult(iterator, update, finish, error, x, (it) =>
                it.return ? it.return() : DONE,
              )
            }
          })
        } else if (!v || !v.done) {
          // FIXME draba - promise or not - finish may give a non promise result even though this may be an async iterator
          v = getNextResult(
            iterator,
            update,
            finish,
            error,
            v || {index: 0, state: {hasValue: false}, proceed: 'finish'},
            (it) => (it.return ? it.return() : DONE),
          )
        }

        return isPromise(v)
          ? v.then(({value}) => ({...value, done: true}))
          : {...v.value, done: true}
      },

      next() {
        if (v && isPromise(v)) {
          v = v.then((x) =>
            !x.done
              ? getNextResult(iterator, update, finish, error, x, (it) =>
                  it.next(),
                )
              : Promise.resolve({done: true, value: DONE, proceed: true}),
          )
        } else if (v && !isPromise(v)) {
          v = !v.done
            ? getNextResult(iterator, update, finish, error, v, (it) =>
                it.next(),
              )
            : {done: true, value: DONE, proceed: true}
        } else if (!v) {
          v = getNextResult(
            iterator,
            update,
            finish,
            error,
            {
              index: 0,
              state: {hasValue: false},
              proceed: true,
            },
            (it) => it.next(),
          )
        }

        return isPromise(v) ? v.then(({value}) => value) : v.value
      },
    } as Iterator<TOut> | AsyncIterator<TOut>
  }
}

export type RUpdate<TOut, TState> = {
  done: false
  value: IteratorResult<TOut> | false
  state: Value<TState>
  index: number
}

export type RFinish<TOut> = {
  done: true
  value: IteratorResult<TOut>
}

type RProceed<TOut, TState> = (RUpdate<TOut, TState> & Proceed) | RFinish<TOut>

type RNext<TIn, TOut, TState> =
  | (RUpdate<TOut, TState> & Next<TIn>)
  | RFinish<TOut>

type PromiseOrNot<T> = T | Promise<T>

export function getNextResult<
  TIn,
  TOut,
  TState,
  TIterator extends Iterator<TIn> | AsyncIterator<TIn>
>(
  iterator: TIterator,
  update: (
    value: TIn,
    index: number,
    state: Value<TState>,
  ) => PromiseOrNot<UpdateResult<TOut, TState> & Proceed>,
  finish: (
    state: Value<TState>,
    index: number,
  ) => PromiseOrNot<FinishResult<TOut>>,
  error: (
    error: any,
    value: TIn,
    index: number,
    state: Value<TState>,
  ) => PromiseOrNot<UpdateResult<TOut, TState> & Proceed>,
  params: {index: number; state: Value<TState>} & Next<TIn>,
  getNext: (
    it: TIterator,
  ) => IteratorResult<TIn> | Promise<IteratorResult<TIn>>,
): PromiseOrNot<RNext<TIn, TOut, TState>> {
  let emit: PromiseOrNot<RNext<TIn, TOut, TState>> | false = false
  let state = params

  while (!emit) {
    const next =
      state.proceed === true
        ? getNext(iterator)
        : state.proceed === false
        ? state.next
        : DONE
    const result = isPromise(next)
      ? next.then((r) => updateNext(r, update, finish, error, state))
      : updateNext(next, update, finish, error, state)

    if (isPromise(result)) {
      emit = result.then((r) => {
        if (r.done || r.value) {
          return applyProceed(r, next)
        } else {
          return getNextResult(
            iterator,
            update,
            finish,
            error,
            applyProceed(r, next),
            getNext,
          )
        }
      })
    } else {
      emit = result.value ? applyProceed(result, next) : false
      state = applyProceed(
        result.done
          ? state
          : {index: result.index, proceed: result.proceed, state: result.state},
        next,
      )
    }
  }

  return emit
}

function applyProceed<T, TIn>(
  result: T & Partial<Proceed>,
  next: PromiseOrNot<IteratorResult<TIn>>,
): T & Next<TIn> {
  return result.proceed
    ? {
        ...result,
        proceed: result.proceed,
      }
    : {
        ...result,
        proceed: false,
        next,
      }
}

function applyUpdateResult<TOut, TState>(
  result: UpdateResult<TOut, TState> & Proceed,
  index: number,
): RUpdate<TOut, TState> & Proceed {
  return {
    done: false,
    value: result.emit && {done: false, value: result.value},
    state: result.clear
      ? {hasValue: false}
      : {hasValue: true, value: result.state},
    proceed: result.proceed,
    index: result.emit ? index + 1 : index,
  }
}

function applyFinishResult<TOut>(result: FinishResult<TOut>): RFinish<TOut> {
  return {
    done: true,
    value: (result.emit && {done: false, value: result.value}) || DONE,
  }
}

function updateNext<TIn, TOut, TState>(
  next: IteratorResult<TIn>,
  update: (
    value: TIn,
    index: number,
    state: Value<TState>,
  ) => PromiseOrNot<UpdateResult<TOut, TState> & Proceed>,
  finish: (
    state: Value<TState>,
    index: number,
  ) => PromiseOrNot<FinishResult<TOut>>,
  error: (
    error: any,
    value: TIn,
    index: number,
    state: Value<TState>,
  ) => PromiseOrNot<UpdateResult<TOut, TState> & Proceed>,
  {index, state, proceed}: {index: number; state: Value<TState>} & Proceed,
): PromiseOrNot<RProceed<TOut, TState>> {
  if (proceed !== 'finish' && next && !next.done) {
    const updateResult = update(next.value, index, state)
    let result: PromiseOrNot<RProceed<TOut, TState>> | undefined
    if (isPromise(updateResult)) {
      result = updateResult
        .then((r) => applyUpdateResult(r, index))
        .catch((e) =>
          Promise.resolve(
            error(e, next.value, index, state),
          ).then((errorResult) => applyUpdateResult(errorResult, index)),
        )
    } else {
      try {
        result = applyUpdateResult(updateResult, index)
      } catch (e) {
        result = applyUpdateResult(
          error(e, next.value, index, state) as any,
          index,
        ) // FIXME draba - promise or not
      }
    }
    return result
  } else {
    const finishResult = finish(state, index)
    const result = isPromise(finishResult)
      ? finishResult.then(applyFinishResult)
      : applyFinishResult(finishResult)
    return result
  }
}

export function isPromise<T>(
  value: undefined | T | Promise<T>,
): value is Promise<T> {
  return !!(
    value &&
    typeof (value as any)['then'] === 'function' &&
    typeof (value as any)['catch'] === 'function'
  )
}
