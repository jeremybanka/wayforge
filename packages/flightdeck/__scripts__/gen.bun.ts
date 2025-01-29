#!/usr/bin/env bun

import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

import { Biome, Distribution } from "@biomejs/js-api"
import type { Json } from "atom.io/json"
import jsonSchemaToZod from "json-schema-to-zod"
import { Squirrel } from "varmint"

const GEN_DIR_PATH = resolve(import.meta.dirname, `../gen`)
const LNAV_FORMAT_SCHEMA_FILENAME = `lnav-format-schema.gen.ts`
const LNAV_FORMAT_SCHEMA_PATH = resolve(
	GEN_DIR_PATH,
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
	`export const lnavFormatSchema = ${zodSchema.toString()}`,
	`export type LnavFormat = z.infer<typeof lnavFormatSchema>`,
].join(`\n\n`)

const biome = await Biome.create({ distribution: Distribution.NODE })

const formatted = biome.formatContent(content, {
	filePath: LNAV_FORMAT_SCHEMA_FILENAME,
})

const result = biome.lintContent(formatted.content, {
	filePath: LNAV_FORMAT_SCHEMA_FILENAME,
	fixFileMode: `SafeAndUnsafeFixes`,
})

biome.printDiagnostics(result.diagnostics, {
	filePath: LNAV_FORMAT_SCHEMA_FILENAME,
	fileSource: formatted.content,
})

if (!existsSync(GEN_DIR_PATH)) {
	mkdirSync(GEN_DIR_PATH, { recursive: true })
}
writeFileSync(LNAV_FORMAT_SCHEMA_PATH, result.content)
