import {transform} from '../core/transform'

export function first<TIn>() {
  return transform<TIn>({
    update: (value) => ({value, emit: true, clear: true, proceed: 'finish'}),
  })
}
