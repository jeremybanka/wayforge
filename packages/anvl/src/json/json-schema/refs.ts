import { Refinement } from "fp-ts/Refinement"
import { isString } from "fp-ts/string"

import type { Substitute } from "~/packages/anvl/tree/substitute"

import { Int } from "./integer"
import type { JsonSchema } from "./json-schema"
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
