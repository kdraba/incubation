import {JSONSchema} from 'json-schema-to-typescript'

export interface Configuration {
  out: string
  definitions: ReadonlyArray<Readonly<{name: string; schema: JSONSchema}>>
}
