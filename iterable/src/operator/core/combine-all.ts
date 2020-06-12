import {pipe} from '../../pipe'
import {HigherOrderAsync, HigherOrderSync} from './higher-order.type'
import {mergeAll} from './merge-all'
import {scan} from './scan'

function reducer<TIn>(
  agg: Result<TIn[]>,
  {value, index}: {value: TIn; index: number},
): Result<TIn[]> {
  const next = agg.value.slice()
  next[index] = value
  return {
    value: next,
    previous: agg.value,
    index,
  }
}

export interface Result<T> {
  readonly value: T
  readonly previous: T
  readonly index: number
}

export function combineAll<TIn>(): (
  iterator: HigherOrderAsync<TIn> | HigherOrderSync<TIn>,
) => AsyncIterator<Result<Array<TIn | undefined>>> {
  const initial: Result<TIn[]> = {
    value: [],
    previous: [],
    index: -1,
  }
  const fn1: (
    it: HigherOrderAsync<TIn> | HigherOrderSync<TIn>,
  ) => AsyncIterator<{value: TIn; index: number}> = mergeAll<TIn>()
  const fn2: (
    it: AsyncIterator<{value: TIn; index: number}>,
  ) => AsyncIterator<Result<TIn[]>> = scan<
    {value: TIn; index: number},
    Result<TIn[]>
  >(reducer, initial)
  const result: (
    iterator: HigherOrderAsync<TIn> | HigherOrderSync<TIn>,
  ) => AsyncIterator<Result<TIn[]>> = pipe<
    Iterator<TIn> | AsyncIterator<TIn>,
    {value: TIn; index: number},
    Result<TIn[]>
  >(fn1, fn2)

  return result
}
