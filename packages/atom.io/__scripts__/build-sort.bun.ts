#!/usr/bin/env bun

import { createReadStream } from "node:fs"
import * as fs from "node:fs/promises"
import * as path from "node:path"

const DEBUG = false

const files = await fs.readdir(path.join(__dirname, `../dist`))

if (DEBUG) console.log(files)

const botchedDeclarations = files.filter((file) => file.startsWith(`index.d`))

if (DEBUG) console.log({ botchedDeclarations })

const groups: { declaration: string; map?: string }[] = []

const botchedOnlyTsFiles = botchedDeclarations.filter((file) =>
	file.endsWith(`.ts`),
)

for (const file of botchedOnlyTsFiles) {
	const map = botchedDeclarations.find((f) => f === `${file}.map`)
	if (map) {
		groups.push({ declaration: file, map })
	} else {
		groups.push({ declaration: file })
	}
}

if (DEBUG) console.log({ groups })

type NamedGroup = {
	declaration: string
	map?: string
	name: string
}
const namedGroups: NamedGroup[] = []
for (const group of groups) {
	const declaration = group.declaration
	const chunks = createReadStream(path.join(__dirname, `../dist`, declaration), {
		encoding: `utf8`,
		highWaterMark: 1024,
	})

	let groupName = ``
	let leftover = ``
	for await (const chunk of chunks as unknown as AsyncGenerator<string>) {
		if (DEBUG) console.log({ chunk })
		const lines = chunk.split(`\n`)
		if (lines[0]) {
			lines[0] = leftover + lines[0]
		}
		leftover = lines.pop() ?? ``
		for (const line of lines) {
			if (line.startsWith(`//#region `)) {
				if (DEBUG) console.log({ line }, `❗`)
				groupName = line.replace(`//#region `, ``).split(`/`)[0]
				if (DEBUG) console.log({ groupName })
			}
		}
		if (groupName) {
			const namedGroup: NamedGroup = {
				declaration,
				name: groupName,
			}
			if (group.map) {
				namedGroup.map = group.map
			}
			namedGroups.push(namedGroup)
			break
		}
	}
}

if (DEBUG) console.log({ namedGroups })

await Promise.all(
	namedGroups.map(async (group) => {
		const { declaration, map, name } = group
		const tasks = [
			fs.rename(
				path.join(__dirname, `../dist`, declaration),
				path.join(__dirname, `../dist`, name, `index.d.ts`),
			),
		]
		if (map) {
			tasks.push(
				fs.rename(
					path.join(__dirname, `../dist`, map),
					path.join(__dirname, `../dist`, name, `index.d.ts.map`),
				),
			)
		}
		await Promise.all(tasks)
	}),
)
