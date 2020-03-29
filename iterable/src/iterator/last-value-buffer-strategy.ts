import {BufferStrategy} from './pushable-iterator'

type Value<T> = {hasValue: true; value: T} | {hasValue: false}

export function createLastValueBufferStrategy<T>(): BufferStrategy<
  T,
  T,
  Value<T>
> {
  return {
    push: (_prev, value) => ({hasValue: true, value}),
    pop: (state: Value<T>) =>
      state.hasValue
        ? {
            ready: true,
            state: {hasValue: false},
            value: state.value,
          }
        : {
            ready: false,
          },
    initial: {hasValue: false},
  }
}
