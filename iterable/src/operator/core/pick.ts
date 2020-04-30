import {map} from './map'

export function pick<TIn extends {}, TKey extends keyof TIn>(
  props: ReadonlyArray<TKey>,
) {
  return map<TIn, Pick<TIn, TKey>>((v) => {
    return props.reduce((acc, prop) => ({...acc, [prop]: v[prop]}), {}) as Pick<
      TIn,
      TKey
    >
  })
}
