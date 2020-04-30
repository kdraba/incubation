import {findByBarcode} from './find-by-barcode'
import {findByBarcodeCommand} from './find-by-barcode.command'

findByBarcodeCommand('*', findByBarcode)
  .demandCommand()
  .help()
  .strict()
  .parse(process.argv.slice(2))

/*
findByBarcode(
  '/data/data/com.termux/files/home/storage/external-1/media/discogs_20200220_releases_1.json',
  '/data/data/com.termux/files/home/storage/external-1/media/history-1547992417237.csv',
)
*/
