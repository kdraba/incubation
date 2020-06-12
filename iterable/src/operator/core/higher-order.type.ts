export type HigherOrderSync<TIn> = Iterator<Iterator<TIn>>

export type HigherOrderAsync<TIn> =
  | Iterator<AsyncIterator<TIn> | Iterator<TIn>>
  | AsyncIterator<AsyncIterator<TIn> | Iterator<TIn>>
//  | AsyncIterator<AsyncIterator<TIn>>
