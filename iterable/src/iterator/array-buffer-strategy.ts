import {BufferStrategy} from './pushable-iterator'

export function createArrayBufferStrategy<T>(): BufferStrategy<T, T, T[]> {
  return {
    push: (values: readonly T[], value: Readonly<T>) => [...values, value],
    pop: (values: readonly T[]) =>
      values.length > 0
        ? {
            ready: true,
            state: values.slice(1),
            value: values[0],
          }
        : {
            ready: false,
          },
    initial: [],
  }
}
