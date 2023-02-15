import type { JsonSchema } from "./json-schema"
import { isJsonSchema } from "./json-schema"
import { expandPathForSchema } from "./path-into"
import { isJsonSchemaRef, retrieveRef } from "./refs"
import type { ReffedJsonSchema, JsonSchemaRef } from "./refs"
import { delve } from "../../object"

export const findSubSchema = (
  schema: JsonSchema | ReffedJsonSchema
): ((
  path: (number | string)[] | ReadonlyArray<number | string>
) => Error | ReffedJsonSchema) => {
  if (typeof schema === `boolean`) {
    throw new Error(`The schema does not contain subSchemas`)
  }
  return (path: string[]) => {
    const refMap: Record<string, ReffedJsonSchema> = {}

    const pathIntoSchema = expandPathForSchema(path)
    if (pathIntoSchema instanceof Error) return pathIntoSchema
    if (typeof schema === `boolean`) {
      return new TypeError(`The schema is not a JsonSchema`)
    }
    let subSchema: JsonSchemaRef | ReffedJsonSchema = pathIntoSchema.reduce(
      (acc, key) => (
        console.log({ acc, key }),
        isJsonSchemaRef(acc)
          ? retrieveRef({ refNode: acc, root: schema, refMap })
          : acc?.[key]
      ),
      schema
    )
    if (subSchema instanceof Error) throw subSchema

    while (isJsonSchemaRef(subSchema)) {
      console.log({ subSchema })
      subSchema = retrieveRef({ refNode: subSchema, root: schema, refMap }).node
    }
    console.log({ subSchema })

    if (isJsonSchema(subSchema)) {
      return subSchema
    }
    throw new TypeError(`The subSchema is not a JsonSchema`)
  }
}
