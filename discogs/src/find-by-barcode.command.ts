import yargs from 'yargs'

import {Options} from './find-by-barcode.type'

export function findByBarcodeCommand(
  name: string,
  fn: (options: Options) => void,
) {
  return yargs.command(
    name,
    'retrieves the releases associated with the provided barcodes',
    (y) =>
      y
        .option('releaseFile', {
          alias: 'f',
          describe: 'releases file in json format',
          type: 'string',
          demandOption: true,
        })
        .option('barcodeFile', {
          alias: 'b',
          describe: 'barcodes file in csv format',
          type: 'string',
          demandOption: true,
        }),
    fn,
  )
}
