import { execSync } from "node:child_process"
import fs from "node:fs"
import url from "node:url"

import { PACKAGE_JSON_PATH } from "./constants"
import discoverSubmodules from "./discover-submodules"
import { createLogger } from "./logger"

const FILEPATH = url.fileURLToPath(import.meta.url)
const SCRIPT_NAME = FILEPATH.split(`/`).pop()?.split(`.`)[0] ?? `unknown_file`
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
	const packageJsonText = fs.readFileSync(PACKAGE_JSON_PATH, `utf-8`)
	const newPackageJson = JSON.parse(packageJsonText)
	const oldPackageJson = JSON.parse(packageJsonText)

	const submodules = discoverSubmodules()

	newPackageJson.files = [
		`src`,
		...submodules.flatMap((folder) => [
			`${folder}/package.json`,
			`${folder}/src`,
		]),
		`eslint-plugin/dist`,
	]

	newPackageJson.exports = {
		"./package.json": `./package.json`,
		".": {
			types: `./src/index.ts`,
			import: `./src/index.ts`,
		},
		...submodules.reduce((acc, folder) => {
			acc[`./${folder}/package.json`] = `./${folder}/package.json`
			if (folder === `eslint-plugin`) {
				acc[`./${folder}`] = {
					import: `./${folder}/dist/index.js`,
					require: `./${folder}/dist/index.cjs`,
				}
			} else {
				acc[`./${folder}`] = {
					types: `./${folder}/src/index.ts`,
					import: `./${folder}/src/index.ts`,
				}
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
				logger.error(`testing`, `run \`build:manifest\` to update package.json`)
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
					`Updated package.json to include ${submodules.length} submodules`,
				)
			}
			break
		}
		default:
			throw new Error(`Unknown mode: "${mode}"`)
	}
}
