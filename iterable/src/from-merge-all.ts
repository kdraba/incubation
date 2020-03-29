import {IndexedValue as Result, mergeAll} from './operator/core/merge-all'
import {AsyncBuilder, source} from './pipe'

export function fromMergeAll<TIn1, TIn2>(
  iterable: [
    Iterator<TIn1> | AsyncIterator<TIn1>,
    Iterator<TIn2> | AsyncIterator<TIn2>,
  ],
): AsyncBuilder<Result<TIn1 | TIn2>>
export function fromMergeAll<TIn1, TIn2, TIn3>(
  iterable: [
    Iterator<TIn1> | AsyncIterator<TIn1>,
    Iterator<TIn2> | AsyncIterator<TIn2>,
    Iterator<TIn3> | AsyncIterator<TIn3>,
  ],
): AsyncBuilder<Result<TIn1 | TIn2 | TIn3>>
export function fromMergeAll<TIn>(
  iterable: ReadonlyArray<Iterator<TIn> | AsyncIterator<TIn>>,
): AsyncBuilder<Result<TIn>>
export function fromMergeAll<TIn>(
  iterable: ReadonlyArray<Iterator<TIn> | AsyncIterator<TIn>>,
): AsyncBuilder<Result<TIn>> {
  return source(iterable).pipe(mergeAll())
}
