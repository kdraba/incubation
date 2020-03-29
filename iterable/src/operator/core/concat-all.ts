import {isPromise} from '../../is-promise'
import {HigherOrderAsync, HigherOrderSync} from './higher-order.type'
import {transform} from './transform'

function apply<TIn>(next: IteratorResult<TIn>) {
  if (!next.done) {
    return {emit: true, value: next.value, proceed: false, clear: true} as const
  } else {
    return {emit: false, proceed: true, clear: true} as const
  }
}

export function concatAll<TIn>(): <
  T extends HigherOrderSync<TIn> | HigherOrderAsync<TIn>
>(
  it: T,
) => typeof it extends HigherOrderSync<TIn>
  ? Iterator<TIn>
  : AsyncIterator<TIn> {
  return transform<Iterator<TIn> | AsyncIterator<TIn>, TIn>({
    update: (value) => {
      const next = value.next()
      const result = isPromise(next) ? next.then(apply) : apply(next)
      return result as any
    },
  }) as any
}
