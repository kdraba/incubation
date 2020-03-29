import {reduce} from './reduce'

export function toArray<TIn>() {
  return reduce((agg: TIn[], next: TIn) => [...agg, next], [])
}
