import {open, read} from 'fs'
import {promisify} from 'util'

import {createIndexesFromFileDescriptor} from './create-indexes'
import {Db} from './db'

const delimiter = '\n'
const encoding = 'utf8'

export async function openDbFile<TValue, TKey extends string>(
  path: string,
  generateKey: {[index in TKey]: (value: TValue) => string},
) {
  const fd = await promisify(open)(path, 'r')
  const index = await createIndexesFromFileDescriptor(
    fd,
    generateKey,
    delimiter,
    encoding,
  )

  return new Db<TValue, TKey>(
    index,
    async (pos, length) =>
      promisify(read)(fd, Buffer.alloc(length), 0, length, pos),
    'utf8',
  )
}
