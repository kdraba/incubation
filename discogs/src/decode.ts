import {scan} from '@kdraba/iterable'
import {StringDecoder} from 'string_decoder'

export function decode<TBuffer extends Buffer>(
  decoder = new StringDecoder('utf8'),
) {
  return scan<
    TBuffer,
    {buffer: TBuffer; decoder: StringDecoder; text: string},
    {decoder: StringDecoder}
  >(
    ({decoder}, buffer) => ({
      buffer,
      decoder,
      text: decoder.write(buffer),
    }),
    {
      decoder,
    },
  )
}
