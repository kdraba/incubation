import {Middleware, Response} from './middleware.type'

export function withFound<TValue, TContext>({
  valueProvider,
}: {
  valueProvider: () => Promise<
    {hasValue: true; value: TValue} | {hasValue: false}
  >
}): Middleware<TContext, TContext & Readonly<{value: TValue}>, Response> {
  return async (context, next) => {
    const valueResult = await valueProvider()
    if (!valueResult.hasValue) {
      return Promise.resolve({status: 404})
    } else {
      return await next({...context, value: valueResult.value})
    }
  }
}
