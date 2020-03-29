import {transform} from '../core/transform'

export function last<TIn>() {
  return transform<TIn>({
    update: (value) => ({
      state: value,
      emit: false,
      clear: false,
      proceed: true,
    }),
    finish: (value) =>
      value.hasValue ? {emit: true, value: value.value} : {emit: false},
  })
}
