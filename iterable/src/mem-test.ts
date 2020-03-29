import {gc as mgc} from '@ardatan/node-memwatch'

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

  const it = values(warmUpCount + count, chunkSize)

  const resultIt = op(it)

  let done = false
  let counter = 0
  let failed = 0

  while (!done && !failed) {
    const next = resultIt.next() as any
    const result = next.then ? await next : next
    done = !!result.done

    if (counter === 0) {
      start = gc(key)
      initial = start
      used = start
    } else if (counter < warmUpCount) {
      used = gc(key)
      start = counter === 0 ? used : start

      initial = Math.max(used, initial)
    } else {
      used = gc(key)

      const diffUsed = used - initial

      if (diffUsed > 0) {
        failed = diffUsed
      } else if (done) {
        pass(
          `success after ${counter} iterations (warm up: ${warmUpCount} / count: ${count})`,
        )
      }
    }

    !done && !failed && counter++
  }

  if (counter < warmUpCount) {
    fail(`did not complete warm up ${counter} < ${warmUpCount}`)
  } else if (failed) {
    fail(
      `${key} diff ${failed} > 0 after ${counter -
        warmUpCount} iterations, warm up diff ${initial - start}`,
    )
  } else if (counter < warmUpCount + count) {
    fail(`did not complete values ${counter - warmUpCount} < ${count}`)
  }
}

function gc(key: keyof NodeJS.MemoryUsage) {
  //global.gc()
  mgc()

  const mem = process.memoryUsage()[key]
  //console.log(process.memoryUsage())
  return mem
}
