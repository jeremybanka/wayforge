import { Refinement } from "fp-ts/Refinement"
import { isString } from "fp-ts/string"
import { Schemable } from "io-ts/lib/Guard"

import type { Substitute } from "~/packages/anvl/tree/substitute"

import { Int } from "./integer"
import type { JsonSchema } from "./json-schema"
import { isJsonSchema } from "./json-schema"
import { delve } from "../../object"
import { doesExtend } from "../../object/refinement"

export type JsonSchemaRef = {
  $ref: string
}
export function isJsonSchemaRef(input: unknown): input is JsonSchemaRef {
  return doesExtend({
    $ref: isString,
  })(input)
}

export type ReffedJsonSchema = Substitute<
  JsonSchema,
  JsonSchema,
  JsonSchema | JsonSchemaRef
>

export const colorPalette: ReffedJsonSchema = {
  $defs: {
    colorChannel: {
      type: `integer`,
      minimum: Int(0),
      maximum: Int(255),
    },
    color: {
      type: `object`,
      properties: {
        red: { $ref: `#/$defs/colorChannel` },
        green: { $ref: `#/$defs/colorChannel` },
        blue: { $ref: `#/$defs/colorChannel` },
      },
    },
  },
  type: `array`,
  items: {
    $ref: `#/$defs/color`,
  },
} as const

type RetrieveRefOptions = {
  refNode: JsonSchemaRef
  refMap: Record<string, JsonSchema>
  root: JsonSchema
}
type RetrieveRefResult = {
  node: JsonSchema
  refMap: Record<string, JsonSchema>
}

export const retrieveRef = ({
  refNode: { $ref },
  refMap,
  root,
}: RetrieveRefOptions): RetrieveRefResult => {
  if (typeof root === `boolean`) {
    throw new TypeError(`The root is a boolean and cannot be indexed`)
  }
  if ($ref in refMap) return { node: refMap[$ref], refMap }
  const [_, ...refPath] = $ref.split(`/`)
  const discovery = delve(root, refPath)
  if (discovery instanceof Error) throw discovery
  let node = discovery.found
  while (isJsonSchemaRef(node)) {
    const result = retrieveRef({ refNode: node, refMap, root })
    node = result.node
    refMap = result.refMap
  }
  if (isJsonSchema(node)) {
    return { node, refMap: { ...refMap, [$ref]: node } }
  }
  throw new TypeError(`The refNode is not a JsonSchema`)
}
