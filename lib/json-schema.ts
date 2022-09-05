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
  type: `string`
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
