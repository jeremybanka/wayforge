import fs from "fs"

import { jsonSchemaToZodDereffed } from "json-schema-to-zod"

import { getBareJsonFileNames } from "../lib/fs"

const schemaNames = getBareJsonFileNames(
  fs.readdirSync(`${process.cwd()}/wayfarer/schema`)
)

const jsonSchemata = schemaNames.map((name) =>
  JSON.parse(
    fs.readFileSync(`${process.cwd()}/wayfarer/schema/${name}.json`, `utf8`)
  )
)

Promise.all(
  jsonSchemata.map(
    async (jsonSchema) => await jsonSchemaToZodDereffed(jsonSchema)
  )
).then((zodSchemas) =>
  zodSchemas.forEach((schema, idx) =>
    fs.writeFileSync(`${process.cwd()}/gen/${schemaNames[idx]}.ts`, schema)
  )
)
