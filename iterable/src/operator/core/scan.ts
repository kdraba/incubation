import {transform} from './transform'

export function scan<TIn, TOut = TIn>(
  fn: (agg: TOut | undefined, next: TIn, index: number) => TOut,
): <T extends AsyncIterator<TIn> | Iterator<TIn>>(
  v: T,
) => typeof v extends Iterator<TIn> ? Iterator<TOut> : AsyncIterator<TOut>
export function scan<TIn, TOut, TInitial = TOut>(
  fn: (agg: TOut | TInitial, next: TIn, index: number) => TOut,
  initial: TInitial,
): <T extends AsyncIterator<TIn> | Iterator<TIn>>(
  v: T,
) => typeof v extends Iterator<TIn> ? Iterator<TOut> : AsyncIterator<TOut>
export function scan<TIn, TOut, TInitial>(
  fn: (agg: TOut | TInitial, next: TIn, index: number) => TOut,
  initial?: TInitial,
) {
  return transform<TIn, TOut, TOut>({
    update: (value, index, previous) => {
      const result = fn(
        previous.hasValue ? previous.value : (initial as any),
        value,
        index,
      )

      return {
        state: result,
        value: result,
        emit: true,
        clear: false,
        proceed: true,
      }
    },
  })
}
