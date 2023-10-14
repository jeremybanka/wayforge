import { execSync } from "child_process"
import fs from "fs"
import path from "path"

import { createLogger } from "./logger.node"

const SCRIPT_NAME = __filename.split(`/`).pop()?.split(`.`)[0] ?? `unknown_file`
const ATOM_IO_ROOT = path.resolve(__dirname, `..`)
const EXCLUDE_LIST = [`node_modules`, `src`, `dist`, `coverage`]
const PACKAGE_JSON_PATH = path.join(ATOM_IO_ROOT, `package.json`)
const PACKAGE_JSON_TEXT = fs.readFileSync(PACKAGE_JSON_PATH, `utf-8`)
const ARGS = process.argv.slice(2)
const SHOULD_RUN = ARGS.includes(`--run`)
if (SHOULD_RUN) {
	const mode = ARGS.at(-1)
	if (!mode) {
		throw new Error(
			`No mode specified. Specify 'test' or 'make' as the last argument`,
		)
	}
	main(mode)
}

export default function main(mode: string): void {
	const logger = createLogger(SCRIPT_NAME)
	const newPackageJson = JSON.parse(PACKAGE_JSON_TEXT)
	const oldPackageJson = JSON.parse(PACKAGE_JSON_TEXT)

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

	newPackageJson.files = [
		`dist`,
		`src`,
		...folders.flatMap((folder) => [
			`${folder}/dist`,
			`${folder}/package.json`,
			`${folder}/src`,
		]),
	]

	newPackageJson.exports = {
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

	const oldText = JSON.stringify(oldPackageJson, null, 2)
	const newText = JSON.stringify(newPackageJson, null, 2)

	switch (mode) {
		case `test`: {
			if (oldText === newText) {
				logger.info(`pass`, `package.json is already up to date`)
			} else {
				logger.error(
					`testing`,
					`files in "atom.io/package.json" are missing`,
					newPackageJson.files.filter(
						(filepath) => !oldPackageJson.files.includes(filepath),
					),
				)
				logger.error(
					`testing`,
					`files in "atom.io/package.json" are extraneous`,
					oldPackageJson.files.filter(
						(filepath) => !newPackageJson.files.includes(filepath),
					),
				)
				logger.error(
					`testing`,
					`exports in "atom.io/package.json" are missing`,
					Object.keys(newPackageJson.exports).filter(
						(filepath) => !(filepath in oldPackageJson.exports),
					),
				)
				logger.error(
					`testing`,
					`exports in "atom.io/package.json" are extraneous`,
					Object.keys(oldPackageJson.exports).filter(
						(filepath) => !(filepath in newPackageJson.exports),
					),
				)
				logger.error(`testing`, `run \`build:integrity\` to update package.json`)
				process.exit(1)
			}
			break
		}
		case `make`: {
			if (oldText === newText) {
				logger.info(`no-op`, `package.json is already up to date`)
			} else {
				logger.info(`updating`, `package.json`)
				fs.writeFileSync(
					PACKAGE_JSON_PATH,
					JSON.stringify(newPackageJson, null, 2),
				)
				execSync(`biome format package.json --write`)
				logger.info(
					`done`,
					`Updated package.json to include ${folders.length} submodules`,
				)
			}
			break
		}
		default:
			throw new Error(`Unknown mode: "${mode}"`)
	}
}
