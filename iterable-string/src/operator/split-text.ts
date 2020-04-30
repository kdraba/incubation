import {transform} from '@kdraba/iterable'

export function splitByNewline() {
  return split(/\r?\n/)
}

export function split(splitter: RegExp | string) {
  return transform<string, string, {parts: string[]; split: boolean}>({
    update: (value, _index, previous) => {
      if (previous.hasValue && previous.value.parts.length > 1) {
        const first = previous.value.parts[0]
        const parts = previous.value.parts.slice(1)
        return {
          state: {parts, split: true},
          value: first,
          emit: true,
          clear: false,
          proceed: false,
        }
      } else if (previous.hasValue && previous.value.split) {
        return {
          state: {parts: previous.value.parts, split: false},
          emit: false,
          clear: false,
          proceed: true,
        }
      } else {
        const values = value.split(splitter)
        const parts =
          previous.hasValue && previous.value.parts.length === 1
            ? [previous.value.parts[0] + values[0], ...values.slice(1)]
            : values
        return {
          state: {parts, split: true},
          emit: false,
          clear: false,
          proceed: false,
        }
      }
    },
    finish: (state) => {
      return state.hasValue && state.value.parts.length === 1
        ? {emit: true, value: state.value.parts[0]}
        : {emit: false}
    },
  })
}
