import {FilterMap} from '../operator/core/filter-map.type'

export type Filter<TValue, TSubValue extends TValue> = FilterMap<
  TValue,
  TSubValue
>
