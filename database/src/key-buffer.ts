import {StringDecoder} from 'string_decoder'

import {Encoding} from './encoding.type'

export class KeyBuffer {
  private static blockSize = 4

  constructor(
    private readonly buffer: Buffer,
    private readonly encoding: Encoding,
  ) {}

  public get byteLength() {
    return this.buffer.byteLength
  }

  public appendKey(key: string) {
    const keyBuffer = Buffer.from(key)
    const updatedKeys = Buffer.alloc(
      this.buffer.byteLength + KeyBuffer.blockSize + keyBuffer.byteLength,
    )
    this.buffer.copy(updatedKeys)
    updatedKeys.writeUInt32BE(keyBuffer.byteLength, this.buffer.byteLength)
    keyBuffer.copy(updatedKeys, this.buffer.byteLength + KeyBuffer.blockSize)

    return {
      keyBuffer: new KeyBuffer(updatedKeys, this.encoding),
      index: this.buffer.byteLength,
    }
  }

  public readKey(index: number): string {
    const keySize = this.buffer.readUInt32BE(index)
    return new StringDecoder(this.encoding).write(
      this.buffer.slice(
        index + KeyBuffer.blockSize,
        index + KeyBuffer.blockSize + keySize,
      ),
    )
  }
}
