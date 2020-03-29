import {isPromise} from '../../is-promise'
import {
  Config,
  Finish,
  FinishResult,
  IteratorState,
  Next,
  PromiseOrNot,
  Update,
  UpdateResult,
  Value,
} from './transform.type'

export const DONE: IteratorResult<any> = {done: true} as IteratorResult<any>

export const DONE_PROMISE = Promise.resolve(DONE)

export function updateState<TIn, TOut, TState>(
  result:
    | (Update<TOut, TState> &
        (
          | {proceed: true | 'finish'}
          | {proceed: false; next: IteratorResult<TIn>}
        ))
    | Finish<TOut>,
): IteratorState<TIn, TState> {
  if (result.done) {
    return {
      proceed: 'done',
    }
  } else {
    return result.proceed
      ? {
          proceed: result.proceed,
          index: result.index,
          state: result.state,
        }
      : {
          proceed: false,
          index: result.index,
          state: result.state,
          next: result.next,
        }
  }
}

export function getNextResult<
  TIn,
  TOut,
  TState,
  TIterator extends Iterator<TIn> | AsyncIterator<TIn>
>(
  iterator: TIterator,
  config: Config<TIn, TOut, TState>,
  state: Exclude<IteratorState<TIn, TState>, {proceed: 'done'}>,
  getNext: (it: TIterator) => PromiseOrNot<IteratorResult<TIn>>,
): PromiseOrNot<(Update<TOut, TState> & Next<TIn>) | Finish<TOut>> {
  const nextItValue =
    state.proceed === true
      ? getNext(iterator)
      : state.proceed === false
      ? state.next
      : undefined

  const nextResult = isPromise(nextItValue)
    ? nextItValue.then((v) =>
        updateNext(
          state.proceed === 'finish'
            ? {index: state.index, state: state.state, proceed: 'finish'}
            : {
                index: state.index,
                state: state.state,
                proceed: state.proceed,
                next: v,
              },
          config,
        ),
      )
    : updateNext(
        state.proceed === 'finish' || nextItValue === undefined
          ? {index: state.index, state: state.state, proceed: 'finish'}
          : {
              index: state.index,
              state: state.state,
              proceed: state.proceed,
              next: nextItValue,
            },
        config,
      )

  return nextResult
}

function updateNext<TIn, TOut, TState>(
  data: {
    index: number
    state: Value<TState>
  } & (
    | {proceed: 'finish'}
    | {
        proceed: boolean
        next: IteratorResult<TIn>
      }
  ),
  {update, finish, error}: Config<TIn, TOut, TState>,
): PromiseOrNot<(Update<TOut, TState> & Next<TIn>) | Finish<TOut>> {
  const {index, state} = data
  if (data.proceed !== 'finish' && !data.next.done) {
    const updateResult = update(data.next.value, index, state)
    let result:
      | PromiseOrNot<(Update<TOut, TState> & Next<TIn>) | Finish<TOut>>
      | undefined
    if (isPromise(updateResult)) {
      result = updateResult
        .then((r) => applyUpdateResult(r, data.next, index))
        .catch((e) =>
          Promise.resolve(
            error(e, data.next.value, index, state),
          ).then((errorResult) =>
            applyUpdateResult(errorResult, data.next, index),
          ),
        )
    } else {
      try {
        result = applyUpdateResult(updateResult, data.next, index)
      } catch (e) {
        result = applyUpdateResult(
          error(e, data.next.value, index, state) as any,
          data.next,
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

function applyUpdateResult<TIn, TOut, TState>(
  result: UpdateResult<TOut, TState>,
  next: IteratorResult<TIn>,
  index: number,
): Update<TOut, TState> & Next<TIn> {
  return {
    done: false,
    emit: result.emit && {done: false, value: result.value},
    state: result.clear
      ? {hasValue: false}
      : {hasValue: true, value: result.state},
    ...(result.proceed === false
      ? {proceed: false, next}
      : {proceed: next.done ? 'finish' : result.proceed}),
    index: result.emit ? index + 1 : index,
  }
}

function applyFinishResult<TOut>(result: FinishResult<TOut>): Finish<TOut> {
  return {
    done: true,
    emit: (result.emit && {done: false, value: result.value}) || DONE,
  }
}
