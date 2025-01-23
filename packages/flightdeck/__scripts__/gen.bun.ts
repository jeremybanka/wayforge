#!/usr/bin/env bun

import { writeFileSync } from "node:fs"

import { Biome, Distribution } from "@biomejs/js-api"
import type { Json } from "atom.io/json"
import jsonSchemaToZod from "json-schema-to-zod"
import { Squirrel } from "varmint"

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
	filePath: `lnav-format-schema.gen.ts`,
})

const result = biome.lintContent(formatted.content, {
	filePath: `lnav-format-schema.gen.ts`,
	fixFileMode: `SafeAndUnsafeFixes`,
})

biome.printDiagnostics(result.diagnostics, {
	filePath: `lnav-format-schema.gen.ts`,
	fileSource: formatted.content,
})

writeFileSync(`./gen/lnav-format-schema.gen.ts`, result.content)
