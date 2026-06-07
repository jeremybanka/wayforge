#!/usr/bin/env bun

import { existsSync, mkdirSync } from "node:fs"
import { resolve } from "node:path"

import type { Json } from "atom.io/json"
import { write } from "bun"
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
	return fetch(...params).then((response) => response.json())
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

const dprint = Bun.spawn({
	cmd: [
		resolve(REPO_ROOT, `node_modules/.bin/dprint`),
		`fmt`,
		`--stdin`,
		LNAV_FORMAT_SCHEMA_FILENAME,
	],
	cwd: REPO_ROOT,
	env: {
		...process.env,
		DPRINT_CACHE_DIR: resolve(REPO_ROOT, `.cache/dprint`),
	},
	stdin: `pipe`,
	stdout: `pipe`,
	stderr: `inherit`,
})

await dprint.stdin.write(content)
await dprint.stdin.end()

const formatted = await new Response(dprint.stdout).text()
const exitCode = await dprint.exited
if (exitCode !== 0) {
	throw new Error(`dprint failed with exit code ${exitCode}`)
}

if (!existsSync(FLIGHTDECK_GEN_PATH)) {
	mkdirSync(FLIGHTDECK_GEN_PATH, { recursive: true })
}
await write(LNAV_FORMAT_SCHEMA_PATH, formatted)
