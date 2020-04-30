import yargs from 'yargs'

import {Options} from './parse-releases.type'

export function parseReleasesCommand(
  name: string,
  fn: (options: Options) => void,
) {
  return yargs.command(
    name,
    'parses a monthly dump file (.xml.gz) of discog releases (https://data.discogs.com/) and creates json output',
    (y) =>
      y
        .option('file', {
          alias: 'f',
          describe: 'input file',
          type: 'string',
          demandOption: true,
        })
        .option('outFile', {
          alias: 'o',
          describe: 'output file',
          type: 'string',
          demandOption: true,
        })
        .option('start', {
          alias: 's',
          describe: 'start position',
          type: 'number',
          demandOption: true,
          default: 0,
        })
        .option('end', {
          alias: 'end',
          describe: 'e',
          type: 'number',
          demandOption: true,
          default: 0,
        }),
    fn,
  )
}
