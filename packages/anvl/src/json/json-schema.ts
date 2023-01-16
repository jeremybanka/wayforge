import { isBoolean } from "fp-ts/boolean"
import { isString } from "fp-ts/string"

import type { Json, JsonTypeName } from "."
import { JSON_DEFAULTS } from "."
import { ifDefined } from "../nullish"
import { hasProperties } from "../object"
import { couldBe, isWithin } from "../refinement"

export const JSON_SCHEMA_TYPES = [
  `array`,
  `boolean`,
  `integer`,
  `null`,
  `number`,
  `object`,
  `string`,
] as const

export type JsonSchemaType = (typeof JSON_SCHEMA_TYPES)[number]

export const JSON_SCHEMA_STRING_FORMATS = [
  `date-time`,
  `date`,
  `email`,
  `hostname`,
  `ipv4`,
  `ipv6`,
  `regex`,
  `time`,
  `uri-reference`,
  `uri-template`,
  `uri`,
  `uuid`,
] as const

export type JsonSchemaStringFormat = (typeof JSON_SCHEMA_STRING_FORMATS)[number]

export type StringSchema = {
  type: `string`
  enum?: string[]
  minLength?: number
  maxLength?: number
  pattern?: string
  format?: JsonSchemaStringFormat
}

export type NumberSchema = {
  type: `integer` | `number`
  enum?: number[]
  minimum?: number
  maximum?: number
  exclusiveMinimum?: number
  exclusiveMaximum?: number
  multipleOf?: number
}

export type BooleanSchema = {
  type: `boolean`
  enum?: boolean[]
}

export type NullSchema = {
  type: `null`
}

export type ObjectSchema = {
  type: `object`
  properties?: Record<string, JsonSchema>
  required?: string[]
  additionalProperties?: boolean | { type: JsonSchemaType }
  minProperties?: number
  maxProperties?: number
}

export type ArraySchema = {
  type: `array`
  items?: JsonSchema
  minItems?: number
  maxItems?: number
  uniqueItems?: boolean
}

export type JsonSchemaRoot = {
  $id?: string
  $schema?: string
  definitions?: Record<string, JsonSchema>
}
export type JsonSchemaLeaf = {
  $ref?: string
}
export type JsonSchemaCore =
  | ArraySchema
  | BooleanSchema
  | NullSchema
  | NumberSchema
  | ObjectSchema
  | StringSchema

/* prettier-ignore */
export type JsonSchema =
  | boolean
  | (
      & JsonSchemaCore
      & JsonSchemaRoot 
    )

export const isJsonSchema = couldBe(isBoolean).or(
  hasProperties({
    $id: ifDefined(isString),
    $schema: ifDefined(isString),
    $ref: ifDefined(isString),
    type: isWithin(JSON_SCHEMA_TYPES),
  })
)

// | boolean
// | (ArraySchema &
//     BooleanSchema &
//     NullSchema &
//     NumberSchema &
//     ObjectSchema &
//     Partial<{
//       $id: string
//       $schema: string
//       $ref: string
//       type: JsonSchemaCoreTypes
//     }> &
//     StringSchema)

// export const schemaToTemplate = (schema: JsonSchema): Json => {
//   if (schema === true) {
//     return {}
//   } else if (schema === false) {
//     return null
//   }
//   const { type: schemaType } = schema
//   const type: JsonTypeName =
//     schemaType === `integer` ? `number` : schemaType || `null`
//   const template = JSON_DEFAULTS[type]
//   if (type === `object`) {
//     const { properties } = schema
//     if (properties) {
//       return Object.entries(properties).reduce(
//         (obj, [key, value]) => ({
//           ...obj,
//           [key]: schemaToTemplate(value),
//         }),
//         {}
//       )
//     }
//   } else if (type === `array`) {
//     const { items } = schema
//     if (items) {
//       return [schemaToTemplate(items)]
//     }
//   }
//   return template
// }
