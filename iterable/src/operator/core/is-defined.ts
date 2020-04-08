import {isOfType} from './is-of-type'

function guard<T extends Exclude<any, undefined>>(v: T | undefined): v is T {
  return v !== undefined
}

export function isDefined<T>() {
  return isOfType<T, T | undefined>(guard)
}
