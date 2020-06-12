export interface Request {
  headers: {[name: string]: string}
}

export interface Response {
  status: number
  headers?: {[name: string]: string}
  body?: AsyncIterator<Uint8Array>
}

export interface Context {
  request: Request
  response: Response
}

export type Middleware<TContext, TNextContext, TResponse> = (
  context: TContext,
  next: (c: TNextContext) => Promise<TResponse>,
) => Promise<TResponse>
