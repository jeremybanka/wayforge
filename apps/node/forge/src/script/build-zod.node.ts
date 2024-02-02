import { writeFileSync } from "fs"

import type { JSONSchema7 } from "json-schema"
import jsonSchemaToZod from "json-schema-to-zod"

import { getDirectoryJsonEntries } from "~/packages/ingt/src/utils"

// const schemaNames = getBareJsonFileNames(
//   fs.readdirSync(`${process.cwd()}/wayfarer/schema`)
// )

const schemaEntries = getDirectoryJsonEntries({
	dir: `${process.cwd()}/projects/wayfarer/_schemas`,
	coerce: (input) => input as JSONSchema7,
})

Promise.all(
	schemaEntries.map(
		async ([, jsonSchema]) => await jsonSchemaToZod(jsonSchema as any),
	),
).then((zodSchemas) => {
	let idx = 0
	for (const schema of zodSchemas) {
		writeFileSync(`${process.cwd()}/gen/${schemaEntries[idx][0]}.ts`, schema)
		idx++
	}
})
