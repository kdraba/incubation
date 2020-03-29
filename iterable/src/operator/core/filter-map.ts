import {isPromise} from '../../is-promise'
import {AsyncFilterMap, FilterMap, FilterMapResult} from './filter-map.type'
import {transform} from './transform'

export function filterMap<TIn, TOut = TIn>(
  fn: AsyncFilterMap<TIn, TOut>,
  error?: (
    error: any,
    value: TIn,
    index: number,
  ) => FilterMapResult<TOut> | Promise<FilterMapResult<TOut>>,
): (v: AsyncIterator<TIn> | Iterator<TIn>) => AsyncIterator<TOut>
export function filterMap<TIn, TOut = TIn>(
  fn: FilterMap<TIn, TOut>,
  error?: (
    error: any,
    value: TIn,
    index: number,
  ) => Promise<FilterMapResult<TOut>>,
): (v: AsyncIterator<TIn> | Iterator<TIn>) => AsyncIterator<TOut>
export function filterMap<TIn, TOut = TIn>(
  fn: FilterMap<TIn, TOut>,
  error?: (error: any, value: TIn, index: number) => FilterMapResult<TOut>,
): <T extends AsyncIterator<TIn> | Iterator<TIn>>(
  v: T,
) => typeof v extends Iterator<TIn> ? Iterator<TOut> : AsyncIterator<TOut>
export function filterMap<TIn, TOut = TIn>(
  fn: FilterMap<TIn, TOut> | AsyncFilterMap<TIn, TOut>,
  error?: (
    error: any,
    value: TIn,
    index: number,
  ) => Promise<FilterMapResult<TOut>> | FilterMapResult<TOut>,
): any {
  return transform<TIn, TOut, never>({
    update: (value, index) => {
      const result = fn(value, index) as any
      return (isPromise(result)
        ? result.then((r) =>
            r.skip
              ? {emit: false, clear: true, proceed: true}
              : {value: r.value, emit: true, clear: true, proceed: true},
          )
        : result.skip
        ? {emit: false, clear: true, proceed: true}
        : {value: result.value, emit: true, clear: true, proceed: true}) as any
    },
    error: error
      ? (e, value, index) => {
          const result = error(e, value, index) as any
          return (isPromise(result)
            ? result.then((r) =>
                r.skip
                  ? {emit: false, clear: true, proceed: true}
                  : {value: r.value, emit: true, clear: true, proceed: true},
              )
            : result.skip
            ? {emit: false, clear: true, proceed: true}
            : {
                value: result.value,
                emit: true,
                clear: true,
                proceed: true,
              }) as any
        }
      : undefined,
  })
}
