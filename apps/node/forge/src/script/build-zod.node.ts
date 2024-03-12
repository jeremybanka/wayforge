import { writeFileSync } from "node:fs"

import jsonSchemaToZod from "json-schema-to-zod"
import type { JsonSchemaObject } from "json-schema-to-zod"

import { getDirectoryJsonEntries } from "~/packages/ingt/src/utils"

// const schemaNames = getBareJsonFileNames(
//   fs.readdirSync(`${process.cwd()}/wayfarer/schema`)
// )

const schemaEntries = getDirectoryJsonEntries({
	dir: `${process.cwd()}/projects/wayfarer/_schemas`,
	coerce: (input) => input as JsonSchemaObject,
})

void Promise.all(
	schemaEntries.map(([, jsonSchema]) => jsonSchemaToZod(jsonSchema as any)),
).then((zodSchemas) => {
	let idx = 0
	for (const schema of zodSchemas) {
		writeFileSync(`${process.cwd()}/gen/${schemaEntries[idx][0]}.ts`, schema)
		idx++
	}
})
