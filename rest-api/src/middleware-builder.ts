import {Back, BackChain, BackChainStart} from './back-chain'
import {Middleware} from './middleware.type'

export class MiddlewareBuilder<TContext, TNextContext, TResponse> {
  constructor(private readonly back: Back<TNextContext, TContext, TResponse>) {}

  add<TNewContext>(
    middleware: Middleware<TNextContext, TNewContext, TResponse>,
  ): MiddlewareBuilder<TContext, TNewContext, TResponse> {
    return new MiddlewareBuilder<TContext, TNewContext, TResponse>(
      new BackChain<TNextContext, TNewContext, TContext, TResponse>(
        middleware,
        this.back,
      ),
    )
  }

  create(fn: (c: TNextContext) => Promise<TResponse>) {
    return this.back.create(fn)
  }
}

export function createMiddlewareBuilder<TContext, TNextContext, TResponse>(
  middleware: Middleware<TContext, TNextContext, TResponse>,
) {
  return new MiddlewareBuilder(new BackChainStart(middleware))
}
