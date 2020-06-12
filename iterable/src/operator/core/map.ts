import {isPromise} from '../../is-promise'
import {filterMap} from './filter-map'
import {FilterMapResult} from './filter-map.type'

export function map<TIn, TOut>(
  fn: (value: TIn, index: number) => TOut,
  error?: (error: any, value: TIn, index: number) => FilterMapResult<TOut>,
): ((v: Iterator<TIn>) => Iterator<TOut>) &
  ((v: AsyncIterator<TIn>) => AsyncIterator<TOut>)
export function map<TIn, TOut>(
  fn: (value: TIn, index: number) => TOut,
  error: (
    error: any,
    value: TIn,
    index: number,
  ) => Promise<FilterMapResult<TOut>>,
): (v: AsyncIterator<TIn> | Iterator<TIn>) => AsyncIterator<TOut>
export function map<TIn, TOut>(
  fn: (value: TIn, index: number) => Promise<TOut>,
  error?: (
    error: any,
    value: TIn,
    index: number,
  ) => FilterMapResult<TOut> | Promise<FilterMapResult<TOut>>,
): (v: AsyncIterator<TIn> | Iterator<TIn>) => AsyncIterator<TOut>
export function map<TIn, TOut>(
  fn: (value: TIn, index: number) => TOut,
  error?: (
    error: any,
    value: TIn,
    index: number,
  ) => FilterMapResult<TOut> | Promise<FilterMapResult<TOut>>,
): any {
  return filterMap<TIn, TOut>((value, index) => {
    const result = fn(value, index)

    return (isPromise(result)
      ? result.then((v) => ({skip: false, value: v}))
      : {skip: false, value: result}) as any
  }, error as any)
}
