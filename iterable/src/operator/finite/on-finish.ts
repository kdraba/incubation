import {isPromise} from '../../is-promise'
import {transform} from '../core/transform'

export function onFinish<TIn>(
  fn: () => Promise<void>,
): (v: AsyncIterator<TIn> | Iterator<TIn>) => AsyncIterator<TIn>
export function onFinish<TIn>(
  fn: () => void,
): <T extends AsyncIterator<TIn> | Iterator<TIn>>(
  v: T,
) => typeof v extends Iterator<TIn> ? Iterator<TIn> : AsyncIterator<TIn>

export function onFinish<TIn>(fn: () => void | Promise<void>): any {
  return transform<TIn, TIn, never>({
    update: (value) => ({value, emit: true, clear: true, proceed: true} as any),
    finish: () => {
      const result = fn()
      return isPromise(result)
        ? result.then(() => ({emit: false}))
        : ({emit: false} as any)
    },
  })
}
