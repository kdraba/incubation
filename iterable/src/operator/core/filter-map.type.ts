export type FilterMap<TValue, TResult> = (
  value: Readonly<TValue>,
  index: number,
) => FilterMapResult<TResult>
export type AsyncFilterMap<TValue, TResult> = (
  value: Readonly<TValue>,
  index: number,
) => Promise<FilterMapResult<TResult>>
export type FilterMapResult<TValue> = Readonly<
  {skip: false; value: TValue} | {skip: true}
>
