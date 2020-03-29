export function isDefined<TIn extends undefined>() {
  return (value: TIn) => value !== undefined
}
