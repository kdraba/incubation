import {transform} from './transform'

export function distinctUntilChanged<TIn>(
  fn: (value1: TIn, value2: TIn) => boolean = (value1, value2) =>
    value1 === value2,
): <T extends AsyncIterator<TIn> | Iterator<TIn>>(
  v: T,
) => typeof v extends Iterator<TIn> ? Iterator<TIn> : AsyncIterator<TIn> {
  return transform<TIn, TIn, TIn>({
    update: (value, _index, previous) => {
      const emit = previous.hasValue ? !fn(previous.value, value) : true

      return emit
        ? {
            state: value,
            value,
            emit: true,
            clear: false,
            proceed: true,
          }
        : {
            state: value,
            emit: false,
            clear: false,
            proceed: true,
          }
    },
  })
}
