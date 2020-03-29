import {transform} from '../core/transform'

export function takeWhile<TIn>(
  fn: (value: TIn, index: number) => boolean,
  {inclusive = false}: {inclusive?: boolean} = {},
) {
  return transform<TIn, TIn, undefined>({
    update: (value, index) => {
      const result = fn(value, index)
      return result
        ? {state: undefined, value, emit: true, clear: true, proceed: true}
        : inclusive
        ? {emit: true, value, clear: true, proceed: 'finish'}
        : {emit: false, clear: true, proceed: 'finish'}
    },
  })
}
