import {transform} from './transform'

export function isOfType<TOut extends TIn, TIn = any>(
  guard: (v: TIn) => v is TOut,
) {
  return transform<TIn, TOut, never>({
    update: (value) =>
      guard(value)
        ? {value, emit: true, clear: true, proceed: true}
        : {emit: false, clear: true, proceed: true},
  })
}
