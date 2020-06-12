import {pipe} from '../../pipe'
import {scan} from '../core/scan'
import {last} from './last'

export function reduce<TIn, TOut>(
  fn: (agg: TOut | undefined, next: TIn, index: number) => TOut,
): <T extends AsyncIterator<TIn> | Iterator<TIn>>(
  v: T,
) => typeof v extends Iterator<TIn> ? Iterator<TOut> : AsyncIterator<TOut>
export function reduce<TIn, TOut, TInitial>(
  fn: (agg: TOut | TInitial, next: TIn, index: number) => TOut,
  initial: TInitial,
): /*<T extends AsyncIterator<TIn> | Iterator<TIn>>(
  v: T,
) => typeof v extends Iterator<TIn> ? Iterator<TOut> : AsyncIterator<TOut>*/
((v: Iterator<TIn>) => Iterator<TOut>) &
  ((v: AsyncIterator<TIn>) => AsyncIterator<TOut>)
export function reduce<TIn, TOut, TInitial>(
  fn: (agg: TOut | TInitial, next: TIn, index: number) => TOut,
  initial?: TInitial,
): <T extends AsyncIterator<TIn> | Iterator<TIn>>(
  v: T,
) => typeof v extends Iterator<TIn> ? Iterator<TOut> : AsyncIterator<TOut> {
  return pipe(scan(fn as any, initial), last()) as any
}
