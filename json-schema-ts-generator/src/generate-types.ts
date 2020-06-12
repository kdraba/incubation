import {concatMap, map, source} from '@kdraba/iterable'
import {mkdir, writeFile} from 'fs'
import {compile, JSONSchema} from 'json-schema-to-typescript'
import {dirname, join} from 'path'
import {promisify} from 'util'

import {Configuration} from './configuration.type'

function x({definitions, out}: Configuration) {
  const it = source(definitions).pipe(
    map(({name, schema}) => ({name, schema, out})),
  )
  const i: Iterator<{
    name: string
    out: string
    schema: JSONSchema
  }> = it[Symbol.iterator]()
  return i
}

export async function generateTypes(
  configurations: ReadonlyArray<Configuration>,
) {
  const result = source(configurations)
    .pipe(concatMap(x))
    .pipe(
      map(async ({name, schema, out}) => {
        const generated = await compile(schema, name, {
          enableConstEnums: false,
          style: {singleQuote: true},
        })

        return {name, out, generated}
      }),
    )

  for await (const {out, name, generated} of result) {
    const outPath = join(out, name)
    await promisify(mkdir)(dirname(outPath), {recursive: true})
    await promisify(writeFile)(`${outPath}.types.generated.ts`, generated)
  }
}
