import {transform} from '../core/transform'

export function endWith<TIn, TEnd>(endValue: TEnd) {
  return transform<TIn, TIn | TEnd>({
    update: (value) => ({
      value,
      emit: true,
      clear: true,
      proceed: true,
    }),
    finish: () => ({emit: true, value: endValue}),
  })
}
