import {KeyBuffer} from './key-buffer'

export class IndexBuffer {
  private static blockSize = 4
  private static entrySize = 3 * IndexBuffer.blockSize

  constructor(
    private readonly buffer: Buffer,
    private readonly keyBuffer: KeyBuffer,
  ) {}

  public get length() {
    return this.buffer.byteLength / IndexBuffer.entrySize
  }

  public get byteLength() {
    return this.buffer.byteLength
  }

  public get keysByteLength() {
    return this.keyBuffer.byteLength
  }

  public insert(key: string, index: number, pos: number, length: number) {
    if (
      (this.length > 0 && (index < -1 || index >= this.length)) ||
      (this.length <= 0 && index !== 0)
    ) {
      throw new Error(
        `Invalid insertion index <${index}>. For a buffer of length ${
          this.length
        } index has to be in range ${this.length > 0 ? -1 : 0} <= index <= ${
          this.length > 0 ? this.length - 1 : 0
        }`,
      )
    }

    const increasedBuffer = Buffer.alloc(
      this.buffer.byteLength + IndexBuffer.entrySize,
    )
    let indexPos = 0

    if (index === 0 && this.length === 0) {
      indexPos = 0
    } else if (index < 0) {
      this.buffer.copy(increasedBuffer, IndexBuffer.entrySize, 0)
      indexPos = 0
    } else {
      this.buffer.copy(
        increasedBuffer,
        0,
        0,
        (index + 1) * IndexBuffer.entrySize,
      )

      if (index < this.length - 1) {
        this.buffer.copy(
          increasedBuffer,
          (index + 1) * IndexBuffer.entrySize,
          index * IndexBuffer.entrySize,
        )
      }

      indexPos = (index + 1) * IndexBuffer.entrySize
    }

    increasedBuffer.writeUInt32BE(pos, indexPos)
    increasedBuffer.writeUInt32BE(length, indexPos + IndexBuffer.blockSize)

    const {keyBuffer: updatedKeys, index: keyIndex} = this.keyBuffer.appendKey(
      key,
    )
    increasedBuffer.writeUInt32BE(
      keyIndex,
      indexPos + 2 * IndexBuffer.blockSize,
    )

    const updatedIndex = new IndexBuffer(increasedBuffer, updatedKeys)

    /*
    try {
      updatedIndex.validate()
    } catch(e) {
      console.error(e)
      throw new Error(`failed to insert ${key} at ${index}`)
    }  */

    return updatedIndex
  }

  public read(index: number) {
    if (index < this.length) {
      const offset = index * IndexBuffer.entrySize
      const pos = this.buffer.readUInt32BE(offset)
      const length = this.buffer.readUInt32BE(offset + IndexBuffer.blockSize)
      const keyIndex = this.buffer.readUInt32BE(
        offset + 2 * IndexBuffer.blockSize,
      )
      const key = this.keyBuffer.readKey(keyIndex)

      return {key, pos, length}
    } else {
      throw new Error(`index out of bound ${index} >= ${this.length}`)
    }
  }

  public validate() {
    let prevKey = ''

    for (let i = 0; i < this.length; i++) {
      const {key} = this.read(i)
      if (prevKey.localeCompare(key) > 0) {
        throw `invalid key order at ${i} with index size ${this.length} : ${prevKey} > ${key}`
      } else {
        prevKey = key
      }
    }
  }
}
