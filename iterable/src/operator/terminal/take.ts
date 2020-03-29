import {takeWhile} from './take-while'

export function take(count: number) {
  return takeWhile((_, index) => index < count - 1, {inclusive: count > 0})
}
