import type { Json, JsonTypeName } from "."
import { JSON_DEFAULTS } from "."

export type JsonSchemaCoreTypes =
  | `array`
  | `boolean`
  | `integer`
  | `null`
  | `number`
  | `object`
  | `string`

export type JsonSchemaStringFormat =
  | `date-time`
  | `date`
  | `email`
  | `hostname`
  | `ipv4`
  | `ipv6`
  | `regex`
  | `time`
  | `uri-reference`
  | `uri-template`
  | `uri`
  | `uuid`

export type StringSchema = {
  // type: `string`
  enum?: string[]
  minLength?: number
  maxLength?: number
  pattern?: string
  format?: JsonSchemaStringFormat
}

export type NumberSchema = {
  // type: `integer` | `number`
  enum?: number[]
  minimum?: number
  maximum?: number
  exclusiveMinimum?: number
  exclusiveMaximum?: number
  multipleOf?: number
}

export type BooleanSchema = {
  // type: `boolean`
  enum?: boolean[]
}

export type NullSchema = {
  // type: `null`
}

export type ObjectSchema = {
  // type: `object`
  properties?: Record<string, JsonSchema>
  required?: string[]
  additionalProperties?: boolean | { type: JsonSchemaCoreTypes }
  minProperties?: number
  maxProperties?: number
}

export type ArraySchema = {
  // type: `array`
  items?: JsonSchema
  minItems?: number
  maxItems?: number
  uniqueItems?: boolean
}

export type JsonSchema =
  | boolean
  | (ArraySchema &
      BooleanSchema &
      NullSchema &
      NumberSchema &
      ObjectSchema &
      Partial<{
        $id: string
        $schema: string
        $ref: string
        type: JsonSchemaCoreTypes
      }> &
      StringSchema)

export const schemaToTemplate = (schema: JsonSchema): Json => {
  if (schema === true) {
    return {}
  } else if (schema === false) {
    return null
  }
  const { type: schemaType } = schema
  const type: JsonTypeName =
    schemaType === `integer` ? `number` : schemaType || `null`
  const template = JSON_DEFAULTS[type]
  if (type === `object`) {
    const { properties } = schema
    if (properties) {
      return Object.entries(properties).reduce(
        (obj, [key, value]) => ({
          ...obj,
          [key]: schemaToTemplate(value),
        }),
        {}
      )
    }
  } else if (type === `array`) {
    const { items } = schema
    if (items) {
      return [schemaToTemplate(items)]
    }
  }
  return template
}
