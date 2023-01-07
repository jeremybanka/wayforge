import { writeFileSync } from "fs"

import type { JSONSchema7 } from "json-schema"
import { jsonSchemaToZodDereffed } from "json-schema-to-zod"

import { getDirectoryJsonEntries } from "~/lib/node/json-fs.node"

// const schemaNames = getBareJsonFileNames(
//   fs.readdirSync(`${process.cwd()}/wayfarer/schema`)
// )

const schemaEntries = getDirectoryJsonEntries({
  dir: `${process.cwd()}/projects/wayfarer/schema`,
  coerce: (input) => input as JSONSchema7,
})

Promise.all(
  schemaEntries.map(
    async ([, jsonSchema]) => await jsonSchemaToZodDereffed(jsonSchema)
  )
).then((zodSchemas) =>
  zodSchemas.forEach((schema, idx) =>
    writeFileSync(`${process.cwd()}/gen/${schemaEntries[idx][0]}.ts`, schema)
  )
)
