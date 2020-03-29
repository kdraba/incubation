import {Filter} from './filter.type'

export function isOfType<TIn, TOut extends TIn>(
  guard: (v: TIn) => v is TOut,
): Filter<TIn, TOut> {
  return (value: TIn) => (guard(value) ? {skip: false, value} : {skip: true})
}
