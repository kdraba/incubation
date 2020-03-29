import * as tsconfig from './tsconfig.json'
import {resolve as resolvePath, join} from 'path'

import * as packageJson from './package.json'
import {promisify} from 'util'
import {exists} from 'fs'

const {workspaces} = packageJson
const {compilerOptions: { paths }} = tsconfig

const p = Object.entries(paths).reduce((o, [key, path]) => { 
  o[key] = resolvePath(path[0], 'index.js')
  return o
}, {})

const excludes = ['face-recognition']

export default Promise.all(workspaces
			   .filter((w) => !excludes.includes(w))
			   .map(async (workspace) => {
  const configFile = `./${workspace}/rollup.config.js`
  const configExists = await promisify(exists)(configFile)
  const configModule = configExists && await import(configFile)
  const config = configModule && configModule.default({base: workspace, paths: p})
			       return config && config.map((c) => ({
    watch: {
	//	include: `${join(workspace, 'dist')}/**/*`,
	exclude: '**/node_modules/**',
	clearScreen: false,	
    },
      ...c,
			       }))
			   }))
.then((configs) => configs.filter((config) => config))
.then((configs) => configs.reduce((acc, config) => [...acc, ...config], []))
