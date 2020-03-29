import {isPromise} from '../../is-promise'
import {filterMap} from './filter-map'

export function tap<TIn>(
  fn: (value: Readonly<TIn>, index: number) => void,
): <T extends AsyncIterator<TIn> | Iterator<TIn>>(
  v: T,
) => typeof v extends Iterator<TIn> ? Iterator<TIn> : AsyncIterator<TIn>
export function tap<TIn>(
  fn: (value: Readonly<TIn>, index: number) => Promise<void>,
): (v: AsyncIterator<TIn> | Iterator<TIn>) => AsyncIterator<TIn>
export function tap<TIn>(
  fn: (value: Readonly<TIn>, index: number) => void | Promise<void>,
): any {
  return filterMap<TIn>((value, index) => {
    const result = fn(value, index)
    return result && isPromise(result)
      ? (result.then(() => ({skip: false, value})) as any)
      : {skip: false, value}
  })
}
