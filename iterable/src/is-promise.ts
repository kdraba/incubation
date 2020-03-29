export function isPromise<T>(
  value: undefined | T | Promise<T>,
): value is Promise<T> {
  return !!(
    value &&
    typeof (value as any)['then'] === 'function' &&
    typeof (value as any)['catch'] === 'function'
  )
}
