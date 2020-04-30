import {map} from './map'

export function pluck<TIn extends {}, TKey extends keyof TIn>(prop: TKey) {
  return map<TIn, TIn[TKey]>((v) => v[prop])
}
