import {isPromise} from '../../is-promise'
import {filterMap} from './filter-map'

export function filter<TIn>(
  fn: (value: TIn, index: number) => Promise<boolean>,
): (v: AsyncIterator<TIn> | Iterator<TIn>) => AsyncIterator<TIn>
export function filter<TIn>(
  fn: (value: TIn, index: number) => boolean,
): /*<T extends AsyncIterator<TIn> | Iterator<TIn>>(
  v: T,
  ) => typeof v extends Iterator<TIn> ? Iterator<TIn> : AsyncIterator<TIn>*/
((v: Iterator<TIn>) => Iterator<TIn>) &
  ((v: AsyncIterator<TIn>) => AsyncIterator<TIn>)
export function filter<TIn>(
  fn: (value: TIn, index: number) => boolean | Promise<boolean>,
): any {
  return filterMap<TIn, TIn>((value, index) => {
    const result = fn(value, index)
    return isPromise(result)
      ? result.then((keep) => (keep ? {skip: false, value} : {skip: true}))
      : result
      ? {skip: false, value}
      : ({skip: true} as any)
  })
}
