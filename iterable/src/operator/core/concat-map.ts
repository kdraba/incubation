import {isPromise} from '../../is-promise'
import {transform} from './transform'

function apply<T, TFn extends (v: T) => any>(
  arg: T | Promise<T>,
  fn: TFn,
): ReturnType<TFn> | Promise<ReturnType<TFn>> {
  return isPromise(arg) ? arg.then((v) => fn(v)) : fn(arg)
}

function applyNext<TOut>(
  currentIt: Iterator<TOut> | AsyncIterator<TOut>,
  next: IteratorResult<TOut>,
) {
  if (!next.done) {
    return {
      emit: true,
      value: next.value,
      proceed: false,
      clear: false,
      state: currentIt,
    } as const
  } else {
    return {emit: false, proceed: true, clear: true} as const
  }
}

export function concatMap<TIn, TOut>(
  fn: (value: TIn, index: number) => Iterator<TOut>,
): <T extends AsyncIterator<TIn> | Iterator<TIn>>(
  v: T,
) => typeof v extends Iterator<TIn> ? Iterator<TOut> : AsyncIterator<TOut>
export function concatMap<TIn, TOut>(
  fn: (
    value: TIn,
    index: number,
  ) =>
    | AsyncIterator<TOut>
    | Iterator<TOut>
    | Promise<Iterator<TOut> | AsyncIterator<TOut>>,
): (it: Iterator<TIn> | AsyncIterator<TIn>) => AsyncIterator<TOut>
export function concatMap<TIn, TOut>(
  fn: (
    value: TIn,
    index: number,
  ) =>
    | Iterator<TOut>
    | AsyncIterator<TOut>
    | Promise<Iterator<TOut> | AsyncIterator<TOut>>,
): (
  it: Iterator<TIn> & AsyncIterator<TIn>,
) => Iterator<TOut> | AsyncIterator<TOut> {
  return transform<TIn, TOut, Iterator<TOut> | AsyncIterator<TOut>>({
    update: (value, index, currentIt) => {
      const it = currentIt.hasValue ? currentIt.value : fn(value, index)
      const next = apply(it, (i) => [i, i.next()] as const)
      const result = apply(next, ([i, r]) => apply(r, (rx) => applyNext(i, rx)))
      return result as any
    },
  }) as any
}
