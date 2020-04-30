import {parseReleases} from './parse-releases'
import {parseReleasesCommand} from './parse-releases.command'

parseReleasesCommand('*', parseReleases)
  .demandCommand()
  .help()
  .strict()
  .parse(process.argv.slice(2))

/*
start({
  file:
    '/data/data/com.termux/files/home/storage/external-1/media/discogs_20200220_releases.xml.gz',
  outFile:
    '/data/data/com.termux/files/home/storage/external-1/media/discogs_20200220_releases.json',
  start: 0,
  end: Number.MAX_SAFE_INTEGER,
})
*/
