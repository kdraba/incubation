import {pipe} from '../../pipe'
import {map} from './map'
import {skipUntil} from './skip-until'

export function skip<TIn>(
  count: number,
): <T extends AsyncIterator<TIn> | Iterator<TIn>>(
  v: T,
) => typeof v extends Iterator<TIn> ? Iterator<TIn> : AsyncIterator<TIn> {
  return pipe<TIn, {value: TIn; index: number}, TIn>(
    pipe(
      map((value, index) => ({value, index})),
      skipUntil(({index}) => index >= count),
    ),
    map(({value}) => value),
  ) as any
}
