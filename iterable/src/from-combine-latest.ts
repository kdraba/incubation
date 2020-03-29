import {combineAll, Result} from './operator/core/combine-all'
import {AsyncBuilder, source} from './pipe'

export function fromCombineLatest<TIn1, TIn2>(
  iterable: readonly [
    Iterator<TIn1> | AsyncIterator<TIn1>,
    Iterator<TIn2> | AsyncIterator<TIn2>,
  ],
): AsyncBuilder<
  Readonly<
    | {
        index: 0
        value: readonly [TIn1, TIn2 | undefined]
        previous: readonly [TIn1 | undefined, TIn2 | undefined]
      }
    | {
        index: 1
        value: readonly [TIn1 | undefined, TIn2]
        previous: readonly [TIn1 | undefined, TIn2 | undefined]
      }
  >
>
export function fromCombineLatest<TIn1, TIn2, TIn3>(
  iterable: readonly [
    Iterator<TIn1> | AsyncIterator<TIn1>,
    Iterator<TIn2> | AsyncIterator<TIn2>,
    Iterator<TIn3> | AsyncIterator<TIn3>,
  ],
): AsyncBuilder<
  Readonly<
    | {
        index: 0
        value: readonly [TIn1, TIn2 | undefined, TIn3 | undefined]
        previous: [TIn1 | undefined, TIn2 | undefined, TIn3 | undefined]
      }
    | {
        index: 1
        value: readonly [TIn1 | undefined, TIn2, TIn3 | undefined]
        previous: [TIn1 | undefined, TIn2 | undefined, TIn3 | undefined]
      }
    | {
        index: 2
        value: readonly [TIn1 | undefined, TIn2 | undefined, TIn3]
        previous: [TIn1 | undefined, TIn2 | undefined, TIn3 | undefined]
      }
  >
>
export function fromCombineLatest<TIn>(
  iterable: ReadonlyArray<Iterator<TIn> | AsyncIterator<TIn>>,
): AsyncBuilder<Result<ReadonlyArray<TIn | undefined>>>
export function fromCombineLatest<TIn>(
  iterable: ReadonlyArray<Iterator<TIn> | AsyncIterator<TIn>>,
): AsyncBuilder<Result<ReadonlyArray<TIn | undefined>>> {
  return source(iterable).pipe(combineAll())
}
