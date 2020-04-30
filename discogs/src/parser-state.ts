export type States<TKey extends string | symbol> = {
  [key in TKey]: Readonly<{
    pattern: RegExp
    minLength: number
    next: ReadonlyArray<TKey>
  }>
}

export type Events =
  | 'releases'
  | 'releaseStart'
  | 'releaseEnd'
  | 'releaseIdStart'
  | 'releaseIdValue'
  | 'releaseIdEnd'
  | 'releaseIdFull'
  | 'identifiersStart'
  | 'identifiersEnd'
  | 'identifierStart'
  | 'identifierEnd'
  | 'identifierBarcodeType'
  | 'barcodeValueFull'
  | 'barcodeValueStart'
  | 'barcodeValue'
  | 'barcodeValueEnd'
  | 'titleFull'
  | 'titleStart'
  | 'titleValue'
  | 'titleEnd'
  | 'tracklistStart'
  | 'tracklistEnd'
  | 'videosStart'
  | 'videosEnd'
  | 'artistsStart'
  | 'artistsEnd'
  | 'artistStart'
  | 'artistEnd'
  | 'artistIdFull'
  | 'artistIdStart'
  | 'artistIdValue'
  | 'artistIdEnd'
  | 'artistNameFull'
  | 'artistNameStart'
  | 'artistNameValue'
  | 'artistNameEnd'
  | 'releasedFull'
  | 'releasedStart'
  | 'releasedValue'
  | 'releasedEnd'
  | 'masterIdStart'
  | 'masterIdEnd'
  | 'masterIdValue'
  | 'isMainReleaseStart'
  | 'isMainReleaseValue'
  | 'isMainReleaseEnd'

export const releaseChildren: ReadonlyArray<Events> = [
  'titleStart',
  //'titleFull',
  'identifiersStart',
  'tracklistStart',
  'videosStart',
  'artistsStart',
  'releasedStart',
  'releaseEnd',
  'masterIdStart',
  'masterIdEnd',
]

export const value: ReadonlyArray<Events> = [
  'releaseIdValue',
  'barcodeValue',
  'titleValue',
  'artistIdValue',
  'artistNameValue',
  'releasedValue',
  'masterIdValue',
  'isMainReleaseValue',
]

export const valueStart: ReadonlyArray<Events> = [
  'releaseIdStart',
  'barcodeValueStart',
  'titleStart',
  'artistIdStart',
  'artistNameStart',
  'releasedStart',
  'masterIdStart',
  'isMainReleaseStart',
]

export const states: States<Events> = {
  releases: {
    minLength: 0,
    pattern: /$/,
    next: ['releaseStart'],
  },
  releaseStart: {
    minLength: '<release '.length,
    pattern: /<release\s+/,
    next: [/*'releaseIdFull',*/ 'releaseIdStart', 'releaseEnd'],
  },
  releaseEnd: {
    minLength: '</release>'.length,
    pattern: /<\/release>/,
    next: ['releaseStart'],
  },
  releaseIdFull: {
    minLength: 'id=""'.length,
    pattern: /id="([^"]*)"/,
    next: releaseChildren,
  },
  releaseIdStart: {
    minLength: 'id="'.length,
    pattern: /id="([^"]*)/,
    next: ['releaseIdEnd', 'releaseIdValue'],
  },
  releaseIdValue: {
    minLength: 1,
    pattern: /^([^"]+)/,
    next: ['releaseIdEnd', 'releaseIdValue'],
  },
  releaseIdEnd: {
    minLength: 1,
    pattern: /^([^"]*)"/,
    next: releaseChildren,
  },

  identifiersStart: {
    minLength: '<identifiers>'.length,
    pattern: /<identifiers>/,
    next: ['identifierStart', 'identifiersEnd'],
  },
  identifiersEnd: {
    minLength: '</identifiers>'.length,
    pattern: /<\/identifiers>/,
    next: releaseChildren,
  },

  identifierStart: {
    minLength: '<identifier '.length,
    pattern: /<identifier\s+/,
    next: ['identifierBarcodeType', 'identifierEnd'],
  },
  identifierEnd: {
    minLength: '/>'.length,
    pattern: /\/>/,
    next: ['identifierStart', 'identifiersEnd'],
  },
  identifierBarcodeType: {
    minLength: 'type="Barcode"'.length,
    pattern: /type="Barcode"/,
    next: ['barcodeValueFull', 'barcodeValueStart', 'identifierEnd'],
  },

  barcodeValueFull: {
    minLength: 'value=""'.length,
    pattern: /value="([^"]*)"/,
    next: ['identifierEnd'],
  },
  barcodeValueStart: {
    minLength: 'value="'.length,
    pattern: /value="([^"]*)/,
    next: ['barcodeValueEnd', 'barcodeValueStart'],
  },
  barcodeValue: {
    minLength: 1,
    pattern: /^([^"]+)/,
    next: ['barcodeValueEnd', 'barcodeValue'],
  },
  barcodeValueEnd: {
    minLength: 1,
    pattern: /^([^"]*)"/,
    next: ['identifierEnd'],
  },

  titleFull: {
    minLength: '<title></title>'.length,
    pattern: /<title>([^<]*)<\/title>/,
    next: releaseChildren,
  },
  titleStart: {
    minLength: '<title>'.length,
    pattern: /<title>([^<]*)/,
    next: ['titleEnd', 'titleValue'],
  },
  titleValue: {
    minLength: 1,
    pattern: /^([^<]+)/,
    next: ['titleEnd', 'titleValue'],
  },
  titleEnd: {
    minLength: '</title>'.length,
    pattern: /^([^<]*)<\/title>/,
    next: releaseChildren,
  },

  tracklistStart: {
    minLength: '<tracklist>'.length,
    pattern: /<tracklist>/,
    next: ['tracklistEnd'],
  },
  tracklistEnd: {
    minLength: '</tracklist>'.length,
    pattern: /<\/tracklist>/,
    next: releaseChildren,
  },

  videosStart: {
    minLength: '<videos>'.length,
    pattern: /<videos>/,
    next: ['videosEnd'],
  },
  videosEnd: {
    minLength: '</videos>'.length,
    pattern: /<\/videos>/,
    next: releaseChildren,
  },

  artistsStart: {
    minLength: '<artists>'.length,
    pattern: /<artists>/,
    next: ['artistStart', 'artistsEnd'],
  },
  artistsEnd: {
    minLength: '</artists>'.length,
    pattern: /<\/artists>/,
    next: releaseChildren,
  },

  artistStart: {
    minLength: '<artist>'.length,
    pattern: /<artist>/,
    next: [
      'artistIdStart',
      //'artistIdFull',
      'artistNameStart',
      //'artistNameFull',
    ],
  },
  artistEnd: {
    minLength: '</artist>'.length,
    pattern: /<\/artist>/,
    next: ['artistStart', 'artistsEnd'],
  },

  artistIdFull: {
    minLength: '<id></id>'.length,
    pattern: /<id><([^<]*)<\/id>/,
    next: [/*'artistNameFull',*/ 'artistEnd'],
  },
  artistIdStart: {
    minLength: '<id>'.length,
    pattern: /<id>([^<]*)/,
    next: ['artistIdValue', 'artistIdEnd'],
  },
  artistIdEnd: {
    minLength: '</id>'.length,
    pattern: /^([^<]*)<\/id>/,
    next: [/*'artistNameFull',*/ 'artistNameStart', 'artistEnd'],
  },
  artistIdValue: {
    minLength: 1,
    pattern: /^([^<]+)/,
    next: [/*'artistNameFull',*/ 'artistNameStart', 'artistEnd'],
  },

  artistNameFull: {
    minLength: '<name></name>'.length,
    pattern: /<name><([^<]*)<\/name>/,
    next: [/*'artistIdFull',*/ 'artistIdStart', 'artistEnd'],
  },
  artistNameStart: {
    minLength: '<name>'.length,
    pattern: /<name>([^<]*)/,
    next: ['artistNameValue', 'artistNameEnd'],
  },
  artistNameEnd: {
    minLength: '</name>'.length,
    pattern: /^([^<]*)<\/name>/,
    next: [/*'artistIdFull',*/ 'artistIdStart', 'artistEnd'],
  },
  artistNameValue: {
    minLength: 1,
    pattern: /^([^<]+)/,
    next: [/*'artistIdFull',*/ 'artistIdStart', 'artistEnd'],
  },

  releasedFull: {
    minLength: '<released></released>'.length,
    pattern: /<released><([^<]*)<\/released>/,
    next: releaseChildren,
  },
  releasedStart: {
    minLength: '<released>'.length,
    pattern: /<released>([^<]*)/,
    next: ['releasedValue', 'releasedEnd'],
  },
  releasedEnd: {
    minLength: '</released>'.length,
    pattern: /^([^<]*)<\/released>/,
    next: releaseChildren,
  },
  releasedValue: {
    minLength: 1,
    pattern: /^([^<]+)/,
    next: ['releasedValue', 'releasedEnd'],
  },

  masterIdStart: {
    minLength: '<master_id>'.length,
    pattern: /<master_id\s+/,
    next: ['isMainReleaseStart'],
  },
  masterIdEnd: {
    minLength: '</master_id>'.length,
    pattern: /^([^<]*)<\/master_id>/,
    next: releaseChildren,
  },
  masterIdValue: {
    minLength: 1,
    pattern: /^([^<]+)/,
    next: ['masterIdValue', 'masterIdEnd'],
  },

  isMainReleaseStart: {
    minLength: 'is_main_release="'.length,
    pattern: /is_main_release="([^"]*)/,
    next: ['isMainReleaseEnd', 'isMainReleaseValue'],
  },
  isMainReleaseValue: {
    minLength: 1,
    pattern: /^([^"]+)/,
    next: ['isMainReleaseEnd', 'isMainReleaseValue'],
  },
  isMainReleaseEnd: {
    minLength: 1,
    pattern: /^([^"]*)"[^>]*>/,
    next: ['masterIdValue'],
  },
}

/*
track></tracklist><identifiers><identifier description="Text" type="Barcode" value="40 14235 31600 9"/><identifier description="Scanned" type="Barcode" value="4014235316009"/
*/

/*
<artists><artist><id>85013</id><name>Nutz Unlimited</name><anv></anv><join></join><role></role><tracks></tracks></artist></artists>

<title>Dear Drum</title><la
*/

/*
<tracklist><track><position>A</position><title>Dear Drum (Glove Mix)</title><duration>3:40</duration><extraartists><artist><id>13797</id><name>Tobi Neumann</name><anv></anv><join></join><role>Remix</role><tracks></tracks></artist></extraartists></track><track><position>B1</position><title>Dear Drum (Glove Mix 'Vocal Edit')</title><duration>3:40</duration><extraartists><artist><id>13797</id><name>Tobi Neumann</name><anv></anv><join></join><role>Remix</role><tracks></tracks></artist></extraartists></track><track><position>B2</position><title>Dear Drum (Ascii Disko Mix)</title><duration>6:58</duration><extraartists><artist><id>29900</id><name>Ascii Disko</name><anv></anv><join></join><role>Remix</role><tracks></tracks></artist></extraartists></track></tracklist>
*/

/*y><released>2002-07-28</released>*/

/*<master_id is_main_release="true">128695</master_id>*/
