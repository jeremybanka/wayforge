#!/usr/bin/env node

import { spawn } from "node:child_process"
import { existsSync, mkdirSync } from "node:fs"
import { writeFile } from "node:fs/promises"
import { resolve } from "node:path"

import type { Json } from "atom.io/foundations/json"
import { parseJson } from "atom.io/foundations/json"
import { jsonSchemaToZod } from "json-schema-to-zod"
import { Squirrel } from "varmint"

const FLIGHTDECK_ROOT = resolve(import.meta.dirname, `..`)
const REPO_ROOT = resolve(FLIGHTDECK_ROOT, `../..`)
const FLIGHTDECK_GEN_PATH = resolve(FLIGHTDECK_ROOT, `gen`)
const LNAV_FORMAT_SCHEMA_FILENAME = `lnav-format-schema.gen.ts`
const LNAV_FORMAT_SCHEMA_PATH = resolve(
	FLIGHTDECK_GEN_PATH,
	LNAV_FORMAT_SCHEMA_FILENAME,
)

const squirrel = new Squirrel(`read-write`)

async function jsonFetch(
	...params: Parameters<typeof fetch>
): Promise<Json.Serializable> {
	const response = await fetch(...params)
	return parseJson(await response.text())
}

const squirrelFetch = squirrel.add(`fetch`, jsonFetch)

const lnavFormatJsonSchema = (await squirrelFetch
	.for(`lnav-schema`)
	.get(`https://lnav.org/schemas/format-v1.schema.json`)) as {
	patternProperties: Record<string, Json.Object>
}
squirrel.flush()

const zodSchema = jsonSchemaToZod(
	lnavFormatJsonSchema.patternProperties[`^(\\w+)$`],
)

const content = [
	`import { z } from "zod"`,
	`export const lnavFormatSchema = ${zodSchema}`,
	`export type LnavFormat = z.infer<typeof lnavFormatSchema>`,
].join(`\n\n`)

const formatted = await new Promise<string>((resolveFormatted, reject) => {
	const dprint = spawn(
		resolve(REPO_ROOT, `node_modules/.bin/dprint`),
		[`fmt`, `--stdin`, LNAV_FORMAT_SCHEMA_FILENAME],
		{
			cwd: REPO_ROOT,
			env: {
				...process.env,
				DPRINT_CACHE_DIR: resolve(REPO_ROOT, `.cache/dprint`),
			},
			stdio: [`pipe`, `pipe`, `inherit`],
		},
	)
	let output = ``
	dprint.stdout.setEncoding(`utf8`)
	dprint.stdout.on(`data`, (chunk: string) => {
		output += chunk
	})
	dprint.on(`error`, reject)
	dprint.stdin.on(`error`, reject)
	dprint.on(`close`, (code) => {
		if (code === 0) resolveFormatted(output)
		else reject(new Error(`dprint failed with exit code ${code}`))
	})
	dprint.stdin.end(content)
})

if (!existsSync(FLIGHTDECK_GEN_PATH)) {
	mkdirSync(FLIGHTDECK_GEN_PATH, { recursive: true })
}
await writeFile(LNAV_FORMAT_SCHEMA_PATH, formatted)
