import {Middleware} from './middleware.type'

export interface Back<TContext, TPreviousContext, TResponse> {
  create(
    next: (context: TContext) => Promise<TResponse>,
  ): (context: TPreviousContext) => Promise<TResponse>
}

export class BackChainStart<TContext, TNextContext, TResponse>
  implements Back<TNextContext, TContext, TResponse> {
  constructor(
    private readonly current: Middleware<TContext, TNextContext, TResponse>,
  ) {}

  create(
    next: (context: TNextContext) => Promise<TResponse>,
  ): (c: TContext) => Promise<TResponse> {
    return (context: TContext) => this.current(context, next)
  }
}

export class BackChain<TContext, TNextContext, TPreviousContext, TResponse>
  implements Back<TNextContext, TPreviousContext, TResponse> {
  constructor(
    private readonly current: Middleware<TContext, TNextContext, TResponse>,
    private readonly previous: Back<TContext, TPreviousContext, TResponse>,
  ) {}

  create(
    next: (context: TNextContext) => Promise<TResponse>,
  ): (c: TPreviousContext) => Promise<TResponse> {
    const middleware = (context: TContext) => this.current(context, next)
    return this.previous.create(middleware)
  }
}
