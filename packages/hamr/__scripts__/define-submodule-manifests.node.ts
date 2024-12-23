import fs from "node:fs"
import url from "node:url"

import type { Json } from "atom.io/json"

import discoverSubmodules from "./discover-submodules.node"
import { createLogger } from "./logger.node"

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
	const submodules = discoverSubmodules()

	const submoduleManifestEntries = submodules.map((moduleName) => {
		const newManifest = defineSubmoduleManifest(moduleName)
		try {
			const modulePath = `${moduleName}/package.json`
			const oldManifest: Json.Object = JSON.parse(
				fs.readFileSync(modulePath, `utf-8`),
			)
			return [moduleName, modulePath, newManifest, oldManifest] as const
		} catch (error) {
			logger.error(
				`test fail`,
				`threw while reading "hamr/${moduleName}/package.json"`,
				error,
			)
			process.exit(1)
		}
	})

	switch (mode) {
		case `test`: {
			for (const [
				moduleName,
				modulePath,
				newManifest,
				oldManifest,
			] of submoduleManifestEntries) {
				const oldText = fs.statSync(modulePath)
					? fs.readFileSync(modulePath, `utf-8`)
					: undefined
				const newText = JSON.stringify(newManifest, null, `\t`) + `\n`
				if (oldText === newText) {
					logger.info(
						`pass`,
						`manifest for "hamr/${moduleName}" is already up to date`,
					)
				} else {
					logger.error(
						`fail`,
						`manifest for "hamr/${moduleName}" is missing or out of date`,
					)
					logger.error(`expected`, newManifest)
					logger.error(`received`, oldManifest)
					logger.info(
						`to fix this error`,
						`run \`build:manifest\` to update manifest files`,
					)
					process.exit(1)
				}
			}
			break
		}
		case `make`: {
			for (const [
				moduleName,
				modulePath,
				newManifest,
			] of submoduleManifestEntries) {
				const oldText = fs.statSync(modulePath)
					? fs.readFileSync(modulePath, `utf-8`)
					: undefined
				const newText = JSON.stringify(newManifest, null, `\t`) + `\n`
				if (oldText === newText) {
					logger.info(
						`no-op`,
						`manifest for "hamr/${moduleName}" is already up to date`,
					)
				} else {
					logger.info(`updating`, modulePath)
					fs.writeFileSync(modulePath, newText)
					logger.info(`done`, `updated manifest for "hamr/${moduleName}"`)
				}
			}
			break
		}
		default:
			logger.error(`test fail`, `Unknown mode: "${mode}"`)
			process.exit(1)
	}
}

function defineSubmoduleManifest(submoduleName: string): Json.Object {
	const submoduleNameParts = submoduleName.split(`/`)
	const manifestName = `hamr-${submoduleNameParts.join(`-`)}`
	return {
		name: manifestName,
		type: `module`,
		private: true,
		main: `dist/index.cjs`,
		module: `dist/index.mjs`,
		types: `dist/index.d.ts`,
		exports: {
			".": {
				types: `./dist/index.d.ts`,
				import: `./dist/index.js`,
				browser: `./dist/index.js`,
				require: `./dist/index.cjs`,
			},
		},
	}
}
