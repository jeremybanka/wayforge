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

	newPackageJson.files = [`dist`, `src`]

	newPackageJson.exports = {
		"./package.json": `./package.json`,
		".": {
			import: `./dist/main/index.js`,
			types: `./dist/main/index.d.ts`,
		},
		...submodules.reduce(
			(acc, folder) => {
				acc[`./${folder}`] = {
					import: `./dist/${folder}/index.js`,
					types: `./dist/${folder}/index.d.ts`,
				}
				if (folder === `react-devtools`) {
					acc[`./react-devtools/css`] = {
						import: `./dist/${folder}/index.css`,
					}
				}
				return acc
			},
			{} as Record<string, string | { import: string; types?: string }>,
		),
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
						(filepath: string) => !oldPackageJson.files.includes(filepath),
					),
				)
				logger.error(
					`testing`,
					`files in "atom.io/package.json" are extraneous`,
					oldPackageJson.files.filter(
						(filepath: string) => !newPackageJson.files.includes(filepath),
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
