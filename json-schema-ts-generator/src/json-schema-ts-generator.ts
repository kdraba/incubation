import { readFile, writeFile } from 'fs'
import { compileFromFile } from 'json-schema-to-typescript'
import { basename , join} from 'path'
import { promisify } from 'util'

const schemas = [
  {
    out: 'src',
    parts: [
      { name: 'Comments', path: '' },
      { name: 'Comment', path: '.items.properties.comment' },
    ],
    path: 'doc-generator/comments.schema.json',
    root: 'src',
  },
  {
    out: 'src',
    parts: [
      { name: 'IpcRequest', path: '' },
      { name: 'IpcRequestHeaders', path: '.definitions.headers' },
    ],
    path: 'ipc/ipc-request.schema.json',
    root: 'src',
  },
  {
    out: 'src',
    parts: [
      { name: 'IpcResponse', path: '' },
      { name: 'IpcResponseHeaders', path: '.definitions.headers' },
      { name: 'IpcResponseSuccess', path: '.definitions.success' },
      { name: 'IpcResponseFailure', path: '.definitions.failure' },
    ],
    path: 'ipc/ipc-response.schema.json',
    root: 'src',
  },
]

schemas
  .map(({ root, path, out }) => compileFromFile(join(root, path), { enableConstEnums: false, style: { singleQuote: true }}).then((generated) => ({ root, path, out, generated })))
  .forEach((ready) => ready.then(({ out, path, generated }) =>
    writeFile(`${join(out, path)}.types.generated.ts`, generated, (error) => console.log(error))
  ))

schemas
  .map(({ root, path, out }) => promisify(readFile)(join(root, path)).then((content) => ({ root, path, out, content })))
  .map((ready) => ready.then(({ path, out, content }) => ({ path, out, generated: `export const schema = 
${content}
` })))
  .forEach((ready) => ready.then(({ out, path, generated }) =>
    writeFile(`${join(out, path)}.generated.ts`, generated, (error) => console.log(error))
  ))

schemas
  .map(({ root, path, out, parts }) => ({ out, path, root, generated: `import Ajv from 'ajv'
import { schema } from './${basename(path)}.generated'
import {${parts.map(({ name }) => name).join(', ')}} from './${basename(path)}.types.generated'

const ajv = new Ajv()

${parts.map(({ name, path }) => `
export const validate${name} = ajv.compile({ ...schema${path}, definitions: (schema as any).definitions })
export function is${name}(value: any): value is ${name} {
  return !!validate${name}(value)
}`).join('\n')}
` }))
  .forEach(({ out, path, generated }) =>
    writeFile(`${join(out, path)}.validator.generated.ts`, generated, (error) => console.log(error))
  )
