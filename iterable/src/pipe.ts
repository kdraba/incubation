class Builder<TIn, TOut> {
  constructor(
    private readonly iterator: () => Iterator<TIn> | AsyncIterator<TIn>,
    private readonly operator: (
      it: Iterator<TIn> | AsyncIterator<TIn>,
    ) => Iterator<TOut> | AsyncIterator<TOut>,
  ) {}

  public pipe<TNext>(
    op: (
      v: Iterator<TOut> | AsyncIterator<TOut>,
    ) => Iterator<TNext> | AsyncIterator<TNext>,
  ) {
    return new Builder(
      this.iterator,
      pipe(this.operator as any, op as any) as any,
    )
  }

  public [Symbol.iterator]() {
    return this.operator(this.iterator())
  }

  public [Symbol.asyncIterator]() {
    const it = this.operator(this.iterator())
    return {
      next: () => Promise.resolve(it.next()),
      return: () =>
        it.return
          ? Promise.resolve(it.return())
          : Promise.resolve({done: true} as IteratorResult<TOut>),
    }
  }

  public async toPromise() {
    let result: {hasValue: true; value: TOut} | {hasValue: false} = {
      hasValue: false,
    }

    for await (const value of this) {
      result = {hasValue: true, value}
    }

    if (result.hasValue) {
      return result.value
    } else {
      throw new Error('empty async iterator')
    }
  }
}

export interface SyncBuilder<TIn> extends Iterable<TIn> {
  pipe<TOut>(op: (v: Iterator<TIn>) => Iterator<TOut>): SyncBuilder<TOut>
  pipe<TOut>(op: (v: Iterator<TIn>) => AsyncIterator<TOut>): AsyncBuilder<TOut>
}

export interface AsyncBuilder<TIn> extends AsyncIterable<TIn> {
  pipe<TOut>(
    op: (v: AsyncIterator<TIn>) => AsyncIterator<TOut>,
  ): AsyncBuilder<TOut>
  toPromise(): Promise<TIn>
}

export function source<TIn>(it: Iterable<TIn>): SyncBuilder<TIn> {
  return new Builder(
    () => it[Symbol.iterator](),
    (v) => v,
  ) as any
}

export function asyncSource<TIn>(it: AsyncIterable<TIn>): AsyncBuilder<TIn> {
  return new Builder(
    () => it[Symbol.asyncIterator](),
    (v) => v,
  ) as any
}

export function pipe<TIn, TNext, TOut>(
  op1: (v: Iterator<TIn> | AsyncIterator<TIn>) => AsyncIterator<TNext>,
  op2: (v: AsyncIterator<TNext>) => AsyncIterator<TOut>,
): (v: Iterator<TIn> | AsyncIterator<TIn>) => AsyncIterator<TOut>
export function pipe<TIn, TNext, TOut>(
  op1: (v: Iterator<TIn>) => Iterator<TNext>,
  op2: (v: Iterator<TNext>) => Iterator<TOut>,
): (v: Iterator<TIn>) => Iterator<TOut>
export function pipe<TIn, TNext, TOut>(
  op1: (v: Iterator<TIn>) => Iterator<TNext>,
  op2: (v: Iterator<TNext>) => AsyncIterator<TOut>,
): (v: AsyncIterator<TIn>) => AsyncIterator<TOut>
export function pipe<TIn, TNext, TOut>(
  op1: (v: Iterator<TIn>) => AsyncIterator<TNext>,
  op2: (v: AsyncIterator<TNext>) => AsyncIterator<TOut>,
): (v: AsyncIterator<TIn>) => AsyncIterator<TOut>
export function pipe<TIn, TNext, TOut>(
  op1: (v: AsyncIterator<TIn>) => AsyncIterator<TNext>,
  op2: (v: AsyncIterator<TNext>) => AsyncIterator<TOut>,
): (v: AsyncIterator<TIn>) => AsyncIterator<TOut>
export function pipe<TIn, TNext, TOut>(
  op1: (
    v: Iterator<TIn> & AsyncIterator<TIn>,
  ) => Iterator<TNext> | AsyncIterator<TNext>,
  op2: (
    v: Iterator<TNext> & AsyncIterator<TNext>,
  ) => Iterator<TOut> | AsyncIterator<TOut>,
): any {
  // (v: Iterator<TIn> | AsyncIterator<TIn>) => Iterator<TOut> | AsyncIterator<TOut> {
  return (it: any) => op2(op1(it) as any)
}
