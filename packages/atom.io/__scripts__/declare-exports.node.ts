import { execSync } from "child_process"
import fs from "fs"
import path from "path"

const ATOM_IO_ROOT = path.resolve(__dirname, `..`)
const EXCLUDE_LIST = [`node_modules`, `src`, `dist`, `coverage`]

// Read the current package.json
const packageJsonPath = path.join(ATOM_IO_ROOT, `package.json`)
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, `utf-8`))

// Get a list of all folders in the package's root directory
const folders = fs
	.readdirSync(ATOM_IO_ROOT, { withFileTypes: true })
	.filter((dirent) => dirent.isDirectory())
	.filter((dirent) => !EXCLUDE_LIST.includes(dirent.name))
	.flatMap((dirent) => {
		const contents = fs.readdirSync(path.join(ATOM_IO_ROOT, dirent.name))
		const isLeaf = contents.includes(`src`) && contents.includes(`dist`)
		return isLeaf
			? dirent.name
			: contents.map((content) => path.join(dirent.name, content))
	})
	.filter(
		(folder) =>
			!EXCLUDE_LIST.includes(folder) &&
			!folder.startsWith(`__`) &&
			!folder.endsWith(`__`) &&
			!folder.startsWith(`.`),
	)

// Map these folders to the files and exports properties
packageJson.files = [
	`dist`,
	`src`,
	...folders.flatMap((folder) => [
		`${folder}/dist`,
		`${folder}/package.json`,
		`${folder}/src`,
	]),
]

packageJson.exports = {
	"./package.json": `./package.json`,
	".": {
		types: `./dist/index.d.ts`,
		browser: `./dist/index.mjs`,
		import: `./dist/index.mjs`,
		require: `./dist/index.js`,
	},
	...folders.reduce((acc, folder) => {
		acc[`./${folder}/package.json`] = `./${folder}/package.json`
		acc[`./${folder}`] = {
			types: `./${folder}/dist/index.d.ts`,
			browser: `./${folder}/dist/index.mjs`,
			import: `./${folder}/dist/index.mjs`,
			require: `./${folder}/dist/index.js`,
		}
		return acc
	}, {}),
}

// Write the updated properties back to the package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))

execSync(`biome format package.json --write`)

console.log(
	`Updated package.json with files and exports properties based on folders.`,
)
