#!/usr/bin/env bun

import { existsSync, mkdirSync } from "node:fs"
import { resolve } from "node:path"

import { Biome, Distribution } from "@biomejs/js-api"
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
	`import { z } from "zod/v3"`,
	`export const lnavFormatSchema = ${zodSchema}`,
	`export type LnavFormat = z.infer<typeof lnavFormatSchema>`,
].join(`\n\n`)

const biome = await Biome.create({ distribution: Distribution.NODE })

const { projectKey } = biome.openProject(REPO_ROOT)

const formatted = biome.formatContent(projectKey, content, {
	filePath: LNAV_FORMAT_SCHEMA_FILENAME,
})

const result = biome.lintContent(projectKey, formatted.content, {
	filePath: LNAV_FORMAT_SCHEMA_FILENAME,
	fixFileMode: `safeAndUnsafeFixes`,
})

biome.printDiagnostics(result.diagnostics, {
	filePath: LNAV_FORMAT_SCHEMA_FILENAME,
	fileSource: formatted.content,
})

if (!existsSync(FLIGHTDECK_GEN_PATH)) {
	mkdirSync(FLIGHTDECK_GEN_PATH, { recursive: true })
}
await write(LNAV_FORMAT_SCHEMA_PATH, result.content)
