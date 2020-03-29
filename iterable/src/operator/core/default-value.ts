import {transform} from './transform'

export function defaultValue<TIn, TDefault = TIn>(value: TDefault) {
  return transform<TIn, TIn | TDefault, boolean>({
    update: (value) => ({
      state: true,
      value,
      emit: true,
      clear: false,
      proceed: true,
    }),
    finish: (state) =>
      state.hasValue && state.value ? {emit: false} : {emit: true, value},
  })
}
