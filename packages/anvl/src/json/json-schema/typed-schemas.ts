import { isBoolean } from "fp-ts/boolean"
import { isNumber } from "fp-ts/number"
import { isString } from "fp-ts/string"

import type { JsonSchemaStringFormat } from "./format"
import { JSON_SCHEMA_STRING_FORMATS } from "./format"
import type { integer } from "./integer"
import { isInteger } from "./integer"
import type {
  JsonSchema,
  JsonSchemaRef,
  JsonSchemaTypeName,
} from "./json-schema"
import {
  isJsonSchema,
  isJsonSchemaRef,
  JSON_SCHEMA_TYPE_NAMES,
} from "./json-schema"
import { isArray } from "../../array"
import { ifDefined } from "../../nullish"
import { doesExtend, isRecord } from "../../object"
import { isLiteral, isWithin, isUnion } from "../../refinement"

export type StringSchema = {
  type: `string`
  enum?: string[]
  minLength?: integer
  maxLength?: integer
  pattern?: string
  format?: JsonSchemaStringFormat
}
export const stringSchemaStructure = {
  type: isLiteral(`string`),
  enum: ifDefined(isArray(isString)),
  minLength: ifDefined(isInteger),
  maxLength: ifDefined(isInteger),
  pattern: ifDefined(isString),
  format: ifDefined(isWithin(JSON_SCHEMA_STRING_FORMATS)),
}
export function isStringSchema(input: unknown): input is StringSchema {
  return doesExtend(stringSchemaStructure)(input)
}

export type NumberSchema = {
  type: `number`
  enum?: number[]
  minimum?: number
  maximum?: number
  exclusiveMinimum?: number
  exclusiveMaximum?: number
  multipleOf?: number
}
export const numberSchemaStructure = {
  type: isLiteral(`number`),
  enum: ifDefined(isArray(isNumber)),
  minimum: ifDefined(isNumber),
  maximum: ifDefined(isNumber),
  exclusiveMinimum: ifDefined(isNumber),
  exclusiveMaximum: ifDefined(isNumber),
  multipleOf: ifDefined(isNumber),
}
export function isNumberSchema(input: unknown): input is NumberSchema {
  return doesExtend(numberSchemaStructure)(input)
}

export type IntegerSchema = {
  type: `integer`
  enum?: integer[]
  minimum?: integer
  maximum?: integer
  exclusiveMinimum?: integer
  exclusiveMaximum?: integer
  multipleOf?: integer
}
export const integerSchemaStructure = {
  type: isLiteral(`integer`),
  enum: ifDefined(isArray(isInteger)),
  minimum: ifDefined(isInteger),
  maximum: ifDefined(isInteger),
  exclusiveMinimum: ifDefined(isInteger),
  exclusiveMaximum: ifDefined(isInteger),
  multipleOf: ifDefined(isInteger),
}
export function isIntegerSchema(input: unknown): input is IntegerSchema {
  return doesExtend(integerSchemaStructure)(input)
}

export type BooleanSchema = {
  type: `boolean`
  enum?: boolean[]
}
export const booleanSchemaStructure = {
  type: isLiteral(`boolean`),
  enum: ifDefined(isArray(isBoolean)),
}
export function isBooleanSchema(input: unknown): input is BooleanSchema {
  return doesExtend(booleanSchemaStructure)(input)
}

export type NullSchema = {
  type: `null`
}
export const nullSchemaStructure = {
  type: isLiteral(`null`),
}
export function isNullSchema(input: unknown): input is NullSchema {
  return doesExtend(nullSchemaStructure)(input)
}

export type ObjectSchema = {
  type: `object`
  properties?: Record<string, JsonSchema>
  required?: string[]
  additionalProperties?: JsonSchema | JsonSchemaRef
  propertyNames?: JsonSchema | JsonSchemaRef
  minProperties?: integer
  maxProperties?: integer
}
export const objectSchemaStructure = {
  type: isLiteral(`object`),
  properties: ifDefined(
    isRecord(isString, isUnion.or(isJsonSchema).or(isJsonSchemaRef))
  ),
  required: ifDefined(isArray(isString)),
  additionalProperties: ifDefined(isUnion.or(isJsonSchemaRef).or(isJsonSchema)),
  propertyNames: ifDefined(isStringSchema),
  minProperties: ifDefined(isInteger),
  maxProperties: ifDefined(isInteger),
}
export function isObjectSchema(input: unknown): input is ObjectSchema {
  return doesExtend(objectSchemaStructure)(input)
}

export type ArraySchema = {
  type: `array`
  items?: (JsonSchema | JsonSchemaRef)[] | JsonSchema | JsonSchemaRef
  minItems?: integer
  maxItems?: integer
  uniqueItems?: boolean
}
export const arraySchemaStructure = {
  type: isLiteral(`array`),
  items: ifDefined(
    isUnion
      .or(isJsonSchema)
      .or(isJsonSchemaRef)
      .or(isArray(isUnion.or(isJsonSchemaRef).or(isJsonSchema)))
  ),
  minItems: ifDefined(isInteger),
  maxItems: ifDefined(isInteger),
  uniqueItems: ifDefined(isBoolean),
}
export function isArraySchema(input: unknown): input is ArraySchema {
  return doesExtend(arraySchemaStructure)(input)
}

export type MixedSchema = Partial<
  Omit<ArraySchema, `type`> &
    Omit<BooleanSchema, `enum` | `type`> &
    Omit<IntegerSchema, `enum` | `type`> &
    Omit<NullSchema, `type`> &
    Omit<NumberSchema, `enum` | `type`> &
    Omit<ObjectSchema, `type`> &
    Omit<StringSchema, `enum` | `type`>
> & {
  type: ReadonlyArray<JsonSchemaTypeName>
  enum?: ReadonlyArray<integer | boolean | number | string>
}
export const mixedSchemaStructure = {
  type: isArray(isWithin(JSON_SCHEMA_TYPE_NAMES)),
  enum: ifDefined(
    isArray(isUnion.or(isNumber).or(isString).or(isBoolean).or(isInteger))
  ),
  items: ifDefined(isJsonSchema),
  minItems: ifDefined(isInteger),
  maxItems: ifDefined(isInteger),
  uniqueItems: ifDefined(isBoolean),
  properties: ifDefined(
    isRecord(isString, isUnion.or(isJsonSchema).or(isJsonSchemaRef))
  ),
  required: ifDefined(isArray(isString)),
  additionalProperties: ifDefined(
    isUnion.or(isBoolean).or(
      doesExtend({
        type: isWithin(JSON_SCHEMA_TYPE_NAMES),
      })
    )
  ),
  minProperties: ifDefined(isInteger),
  maxProperties: ifDefined(isInteger),
  minLength: ifDefined(isInteger),
  maxLength: ifDefined(isInteger),
  pattern: ifDefined(isString),
  format: ifDefined(isWithin(JSON_SCHEMA_STRING_FORMATS)),
  minimum: ifDefined(isNumber),
  maximum: ifDefined(isNumber),
  exclusiveMinimum: ifDefined(isNumber),
  exclusiveMaximum: ifDefined(isNumber),
  multipleOf: ifDefined(isNumber),
}
export function isMixedSchema(input: unknown): input is MixedSchema {
  return doesExtend(mixedSchemaStructure)(input)
}

export type UnionSchema = { anyOf: JsonSchema[] }
export const unionSchemaStructure = {
  anyOf: isArray(isUnion.or(isJsonSchema).or(isJsonSchemaRef)),
}
export function isUnionSchema(input: unknown): input is UnionSchema {
  return doesExtend(unionSchemaStructure)(input)
}
