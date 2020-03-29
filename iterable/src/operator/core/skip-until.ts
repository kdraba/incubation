import {transform} from './transform'

export function skipUntil<TIn>(fn: (value: TIn, index: number) => boolean) {
  return transform<TIn, TIn, boolean>({
    update: (value, index, previous) => {
      const result = (previous.hasValue && previous.value) || fn(value, index)
      return result
        ? {state: result, value, emit: true, clear: false, proceed: true}
        : {emit: false, clear: true, proceed: true}
    },
  })
}
