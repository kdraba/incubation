import {pipe} from '../../pipe'
import {defaultValue} from '../core/default-value'
import {map} from '../core/map'
import {skipUntil} from '../core/skip-until'
import {first} from '../terminal/first'

export function every<TIn>(
  fn: (next: TIn, index: number) => boolean,
): <T extends AsyncIterator<TIn> | Iterator<TIn>>(
  v: T,
) => typeof v extends Iterator<TIn>
  ? Iterator<boolean>
  : AsyncIterator<boolean> {
  return pipe(
    pipe(
      pipe(
        map(fn),
        skipUntil((value) => !value),
      ),
      first(),
    ),
    defaultValue(true),
  ) as any
}
