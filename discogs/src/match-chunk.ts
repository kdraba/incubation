import {States} from './parser-state'

export function matchChunk<TKey extends string | symbol>(
  states: States<TKey>,
  next: ReadonlyArray<TKey>,
  buffer: string,
):
  | {match: RegExpExecArray; key: TKey; buffer: string; bufferStart: number}
  | {match: false; buffer: string; bufferStart: number} {
  const minLength = next.reduce(
    (acc: undefined | {min: number; max: number}, key) =>
      acc === undefined
        ? {min: states[key].minLength, max: states[key].minLength}
        : {
            min: Math.min(acc.min, states[key].minLength),
            max: Math.max(acc.max, states[key].minLength),
          },
    undefined,
  ) || {min: 0, max: 0}

  let i = 0
  let match: {key: TKey; result: RegExpExecArray} | false = false

  while (buffer.length >= minLength.min && i < next.length) {
    const {pattern} = states[next[i]]
    const nextMatch = pattern.exec(buffer) || false
    match =
      nextMatch &&
      (!match ||
        nextMatch.index < match.result.index ||
        (nextMatch.index === match.result.index &&
          nextMatch[1].length > match.result[1].length))
        ? {key: next[i], result: nextMatch}
        : match
    i++
  }

  if (match) {
    const bufferStart = match.result.index + match.result[0].length
    return {
      key: match.key,
      buffer: buffer.slice(bufferStart),
      match: match.result,
      bufferStart: 0,
    }
  } else {
    const bufferStart =
      buffer.length >= minLength.max
        ? Math.max(buffer.length - minLength.max, 0)
        : 0
    return {
      match: false,
      buffer: bufferStart > 0 ? buffer.slice(bufferStart) : buffer,
      bufferStart,
    }
  }
}
