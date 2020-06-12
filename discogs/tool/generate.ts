import {generateTypes} from '@kdraba/json-schema-ts-generator'

import {definitions} from '../model/discogs.schema.json'

const config = [
  {
    out: 'src',
    parts: [{name: 'stats', schema: definitions.stats}],
    path: 'model/discogs.schema.json',
    root: '.',
  },
]

generateTypes(config)
