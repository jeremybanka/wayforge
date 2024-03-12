/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { execSync } from "node:child_process"
import fs from "node:fs"
import url from "node:url"

import { PACKAGE_JSON_PATH, TSCONFIG_JSON_PATH } from "./constants"
import { createLogger } from "./logger.node"

const FILENAME = url.fileURLToPath(import.meta.url)
const SCRIPT_NAME = FILENAME.split(`/`).pop()?.split(`.`)[0] ?? `unknown_file`
const ARGS = process.argv.slice(2)
const SHOULD_RUN = ARGS.includes(`--run`)
if (SHOULD_RUN) {
	const mode = ARGS.at(-1)
	if (mode === undefined) {
		throw new Error(
			`No mode specified. Specify 'test' or 'make' as the last argument`,
		)
	}
	main(mode)
}

export default function main(mode: string): void {
	const logger = createLogger(SCRIPT_NAME)
	const packageJsonText = fs.readFileSync(PACKAGE_JSON_PATH, `utf-8`)
	const packageJson = JSON.parse(packageJsonText)
	const distributionFilepaths: string[] =
		typeof packageJson === `object` &&
		packageJson !== null &&
		`files` in packageJson &&
		Array.isArray(packageJson.files) &&
		packageJson.files.every((filepath: unknown) => typeof filepath === `string`)
			? packageJson.files
			: []
	const tsconfigJsonText = fs.readFileSync(TSCONFIG_JSON_PATH, `utf-8`)
	const oldTsconfigJson = JSON.parse(tsconfigJsonText)
	if (
		typeof oldTsconfigJson === `object` &&
		oldTsconfigJson !== null &&
		`include` in oldTsconfigJson
	) {
		const newTsconfigJson = { ...oldTsconfigJson }

		newTsconfigJson.include = [`__tests__`, ...distributionFilepaths]

		const oldText = JSON.stringify(oldTsconfigJson, null, 2)
		const newText = JSON.stringify(newTsconfigJson, null, 2)

		switch (mode) {
			case `test`: {
				if (oldText === newText) {
					logger.info(`pass`, `tsconfig.prod.json is already up-to-date`)
				} else {
					logger.error(
						`testing`,
						`files and exports in "tsconfig.prod.json" are missing`,
						newTsconfigJson.include.filter(
							(filepath) => !oldTsconfigJson.include.includes(filepath),
						),
					)
					logger.error(
						`testing`,
						`files and exports in "tsconfig.prod.json" are extraneous`,
						oldTsconfigJson.include.filter(
							(filepath) => !newTsconfigJson.include.includes(filepath),
						),
					)
					logger.error(
						`testing`,
						`run \`manifest\` script to update tsconfig.prod.json`,
					)
					process.exit(1)
				}
				break
			}
			case `make`: {
				if (oldText === newText) {
					logger.info(`no-op`, `tsconfig.prod.json is already up-to-date`)
				} else {
					logger.info(`updating`, `tsconfig.prod.json`)
					fs.writeFileSync(
						TSCONFIG_JSON_PATH,
						JSON.stringify(newTsconfigJson, null, 2),
					)
					execSync(`biome format tsconfig.prod.json --write`)
					logger.info(`included`, newTsconfigJson.include)
					logger.info(`done`, `Updated tsconfig.prod.json`)
				}
				break
			}
			default: {
				throw new Error(`Unexpected mode: ${mode}`)
			}
		}
	} else {
		throw new Error(
			`Expected tsconfig.prod.json to have an "include" property, but got ${tsconfigJsonText}`,
		)
	}
}
