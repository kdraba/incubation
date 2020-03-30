function* values(max: number, size: number) {
  let index = 0

  while (index < max) {
    yield Buffer.alloc(size, 'a')
    index++
  }
}

export async function memTest(
  op: (it: Iterator<Buffer>) => Iterator<unknown> | AsyncIterator<unknown>,
  {
    fail,
    pass,
  }: {
    fail: (msg: string) => void
    pass: (msg: string) => void
  },
  {
    count,
    key,
    warmUpCount,
    chunkSize,
    maxRetries = 100,
  }: {
    key: keyof NodeJS.MemoryUsage
    count: number
    warmUpCount: number
    chunkSize: number
    maxRetries?: number
  },
) {
  let success = false
  let counter = 0
  let maxFailed: number | undefined
  let minFailed: number | undefined

  while (!success && counter < maxRetries) {
    const r = await run(op, {count, key, warmUpCount, chunkSize})
    if (r) {
      maxFailed = maxFailed === undefined ? r : Math.max(maxFailed, r)
      minFailed = minFailed === undefined ? r : Math.min(minFailed, r)
    } else {
      success = true
    }

    counter++
  }

  if (!success) {
    fail(
      `${key} max diff ${maxFailed} min diff ${minFailed} after ${counter} retries (warm up: ${warmUpCount} / count: ${count})`,
    )
  } else {
    pass(
      `${key} success after ${counter} retries (warm up: ${warmUpCount} / count: ${count})`,
    )
  }
}

export async function run(
  op: (it: Iterator<Buffer>) => Iterator<unknown> | AsyncIterator<unknown>,
  {
    count,
    key,
    warmUpCount,
    chunkSize,
  }: {
    key: keyof NodeJS.MemoryUsage
    count: number
    warmUpCount: number
    chunkSize: number
  },
) {
  let start = 0
  let initial = 0
  let used = 0
  const end = warmUpCount + count - 1

  const it = values(warmUpCount + count, chunkSize)

  const resultIt = op(it)

  let done = false
  let counter = 0
  let failed = 0

  while (!done && !failed) {
    done = await next(resultIt)

    if (counter === 0) {
      start = await gc(key)
      initial = start
      used = start
    } else if (counter === warmUpCount) {
      used = await gc(key)
      start = counter === 0 ? used : start

      initial = Math.max(used, initial)
    } else if (counter === end) {
      used = await gc(key)

      const diffUsed = used - initial

      if (diffUsed > 0) {
        failed = diffUsed
      } else {
        done = true
      }
    }

    !done && !failed && counter++
  }

  if (counter < end) {
    throw new Error(`did not finish ${counter} < ${end}`)
  }
  return failed
}

async function gc(key: keyof NodeJS.MemoryUsage) {
  global.gc()
  return new Promise<number>((resolve) =>
    setTimeout(() => resolve(process.memoryUsage()[key]), 10),
  )
  //console.log(process.memoryUsage())
}

async function next(
  it: Iterator<unknown> | AsyncIterator<unknown>,
): Promise<boolean> {
  const next = it.next() as any
  const result = next.then ? await next : next
  return !!result.done
}
