#!/usr/bin/env node

import { accessSync, readdirSync, readFileSync } from "node:fs"
import { access, readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"

import { cli, noOptions, required } from "comline"

const parse = cli({
	cliName: `sync-lib-version`,
	routes: required({
		test: null,
		make: null,
	}),
	routeOptions: {
		test: noOptions(),
		make: noOptions(),
	},
})

const { inputs } = parse(process.argv)

const libRoot = join(import.meta.dirname, `..`, `..`, `atom.io`)
const libManifest = join(libRoot, `package.json`)
accessSync(libManifest)

const libVersion = JSON.parse(readFileSync(libManifest).toString()).version

console.log(`found atom.io version: ${libVersion}`)

const templateList = readdirSync(join(import.meta.dirname, `..`, `templates`))

console.log(`found template list:`, templateList)

let didFindMismatch = false
const results = await Promise.all(
	templateList.map(async (template) => {
		const templatePath = join(import.meta.dirname, `..`, `templates`, template)
		const templateManifestPath = join(templatePath, `package.json`)
		await access(templateManifestPath)
		const templateManifest = JSON.parse(
			(await readFile(templateManifestPath)).toString(),
		)
		const templateVersion = templateManifest.dependencies[`atom.io`]

		const isSame = templateVersion === libVersion
		if (!isSame) {
			didFindMismatch = true
		}

		return {
			template,
			templateManifest,
			templateManifestPath,
			templateVersion,
			isSame,
		}
	}),
)

if (didFindMismatch) {
	await Promise.all(
		results.map(
			async ({
				template,
				templateManifest,
				templateManifestPath,
				templateVersion,
				isSame,
			}) => {
				if (!isSame) {
					switch (inputs.case) {
						case `test`:
							console.error(
								`❌ template ${template} version: ${templateVersion}`,
							)
							break
						case `make`:
							{
								const newManifest = {
									...templateManifest,
									dependencies: {
										...templateManifest.dependencies,
										[`atom.io`]: libVersion,
									},
								}
								await writeFile(
									templateManifestPath,
									JSON.stringify(newManifest, null, `\t`) + `\n`,
								)
								console.log(
									`✨ updated template ${template} version from ${templateVersion} to ${libVersion}`,
								)
							}
							break
					}
				}
			},
		),
	)
	switch (inputs.case) {
		case `test`:
			console.error(`❌ some templates are out of date`)
			process.exit(1)
			break
		case `make`:
			console.log(`✨ templates updated`)
			process.exit(0)
	}
}

console.log(`✅ all templates are up to date`)
