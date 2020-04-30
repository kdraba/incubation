import {transform} from '@kdraba/iterable'

import {matchChunk} from './match-chunk'
import {States} from './parser-state'

export function parseChunk<TKey extends string | symbol>(
  states: States<TKey>,
  start: TKey,
) {
  return transform<
    string,
    Readonly<{
      key: TKey
      match: RegExpExecArray
      pos: number
    }>,
    Readonly<{
      key: TKey
      buffer: string
      bufferStart: number
      proceed: boolean
    }>
  >({
    update: (value, _index, previous) => {
      const state =
        previous.hasValue && previous.value.proceed
          ? {
              bufferStart: previous.value.bufferStart,
              buffer: previous.value.buffer + value,
              key: previous.value.key,
            }
          : previous.hasValue && !previous.value.proceed
          ? previous.value
          : {
              buffer: value,
              bufferStart: 0,
              key: start,
            }

      const {next} = states[state.key]

      const result = matchChunk(states, next, state.buffer)
      const proceed = !result.match
      return result.match
        ? {
            state: {
              key: result.key,
              buffer: result.buffer,
              bufferStart: result.bufferStart,
              proceed,
            },
            value: {
              key: result.key,
              match: result.match,
              pos: state.bufferStart,
            },
            emit: true,
            clear: false,
            proceed,
          }
        : {
            state: {
              key: state.key,
              buffer: result.buffer,
              bufferStart: result.bufferStart,
              proceed,
            },
            emit: false,
            clear: false,
            proceed,
          }
    },
    finish: (state) => {
      const result =
        state.hasValue &&
        matchChunk(states, states[state.value.key].next, state.value.buffer)
      return state.hasValue && result && result.match
        ? {
            emit: true,
            value: {
              key: result.key,
              match: result.match,
              pos: state.value.bufferStart,
            },
          }
        : {
            emit: false,
          }
    },
  })
}
