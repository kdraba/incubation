/*
// use range requests for pagination? what about caching?
// https://moz.com/devblog/how-to-cache-http-range-requests
// nope

function withLinkage() {
  // https://tools.ietf.org/html/rfc8288
  // add method and etag as link parameters?
  // method may be restricted by rel, etag is restricted by the resource, i.e. both are not required in lunk data
}

function witConditionalRead(request, etagProvider, fn) {
  const ifNoneMatch = request.headers.get('if-none-match')
  if (ifNoneMatch && ifNoneMatch === etagProvider()) {
    return {continue: false, status: 403}
  } else {
    return fn()
  }
}

function withConditionalWrite(request, etagProvider, fn) {
  const ifMatch = request.headers.get('if-match')
  if (ifMatch && ifMatch !== etagProvider()) {
    return {continue: false, status: 412}
  } else {
    return fn()
  }
}

export function addRoutes<T>({
  createId,
  createIterator,
}: {
  createId: () => string
  createIterator: () => T
}) {
  const cache = TimeoutCache<
    string,
    {it: AsyncIterator<T>; result: IteratorResult<T>; pos: number}
  >()

  return [
    {
      // how do i distinguish this post (the one to create an iterator) from other posts on the same resource? May be i should use a GET with a custom media type and a 303 see other?
      // https://tools.ietf.org/html/rfc7231#section-6.5.7
      method: 'POST',
      fn: async () => {
        const id = createId()
        const it = createIterator()
        const result = await it.next()
        const entry = {it, result, pos: 0}
        cache.set(id, entry)

        response.headers.append('content-location', `${base}/${id}`)
        response.headers.append('etag', entry.pos)

        return result
      },
    },
    {
      method: 'POST',
      fn: async ({id}: {id: string}) => {
        const ifMatch = request.headers.get('if-match')

        const entry = cache.get(id)
        withConditionalWrite(
          request,
          () => entry.pos,
          () => {},
        )
        if (entry && (!ifMatch || ifMatch === entry.pos)) {
          const {it} = entry
          const result = await it.next()
          const pos = entry.pos + 1
          cache.set(id, {it, result, pos})

          response.headers.append('content-location', `${base}/${id}`)
          response.headers.append('etag', entry.pos)

          return result
        }
      },
    },
    {
      method: 'GET',
      fn: ({id}: {id: string}) => {
        const ifNoneMatch = request.headers.get('if-none-match')

        const entry = cache.get(id)
        if (entry) {
          const {result} = entry

          return result
        }

        response.headers.append('etag', entry.pos)
      },
    },
    {
      method: 'DELETE',
      fn: ({id}: {id: string}) => {
        cache.delete(id)
      },
    },
  ]
}

export class TimeoutCache<TKey, TValue> {
  private readonly cache = new Map<TKey, {value: TValue; timeoutId: number}>()

  constructor(private readonly timeout: number) {}

  set(id: TKey, value: TValue) {
    const entry = this.cache.get(id)
    entry && clearTimeout(entry.timeoutId)

    this.cache.set({
      value: value,
      timeoutId: setTimeout(() => {
        this.cache.delete(id)
      }, this.timeout),
    })
  }

  get(id: TKey) {
    const entry = this.cache.get(id)
    if (entry) {
      this.reset(id, entry)
      return entry.value
    } else {
      return undefined
    }
  }

  delete(id: TKey) {
    const entry = this.cache.get(id)
    if (entry) {
      clearTimeout(entry.timeoutId)
      this.cache.delete(id)
    }
  }

  private reset(id: TKey, entry: {value: TValue; timeoutId: number}) {
    clearTimeout(entry.timeoutId)
    this.cache.set({
      value: entry.value,
      timeoutId: setTimeout(() => {
        this.cache.delete(id)
      }, this.timeout),
    })
  }
}
*/
