import {IndexedValue as Result, mergeAll} from './operator/core/merge-all'
import {AsyncBuilder, source} from './pipe'

export function fromMergeAll<TIn1, TIn2>(
  iterable: [
    Iterator<TIn1> | AsyncIterator<TIn1>,
    Iterator<TIn2> | AsyncIterator<TIn2>,
  ],
): AsyncBuilder<Readonly<{index: 0; value: TIn1} | {index: 1; value: TIn2}>>
export function fromMergeAll<TIn1, TIn2, TIn3>(
  iterable: [
    Iterator<TIn1> | AsyncIterator<TIn1>,
    Iterator<TIn2> | AsyncIterator<TIn2>,
    Iterator<TIn3> | AsyncIterator<TIn3>,
  ],
): AsyncBuilder<
  Readonly<
    {index: 0; value: TIn1} | {index: 1; value: TIn2} | {index: 2; value: TIn3}
  >
>
export function fromMergeAll<TIn>(
  iterable: ReadonlyArray<Iterator<TIn> | AsyncIterator<TIn>>,
): AsyncBuilder<Readonly<{index: 0; value: TIn}>>
export function fromMergeAll<TIn>(
  iterable: ReadonlyArray<Iterator<TIn> | AsyncIterator<TIn>>,
): AsyncBuilder<Result<TIn>> {
  return source(iterable).pipe(mergeAll())
}
