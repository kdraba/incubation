import {transform} from './transform'

export function isDefined<T>() {
  return transform<T | undefined, T, never>({
    update: (value) =>
      value !== undefined
        ? {value, emit: true, clear: true, proceed: true}
        : {emit: false, clear: true, proceed: true},
  })
}
