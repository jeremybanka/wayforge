import { isBoolean } from "fp-ts/boolean"
import { Option } from "fp-ts/lib/Option"
import { isNumber } from "fp-ts/number"
import type { Refinement } from "fp-ts/Refinement"
import { isString } from "fp-ts/string"

import { OptionalPropertyOf } from "~/lib/common/notes"

import type { JsonSchemaStringFormat } from "./format"
import { JSON_SCHEMA_STRING_FORMATS } from "./format"
import type { integer } from "./integer"
import { isInteger } from "./integer"
import { JSON_TYPE_NAMES } from ".."
import { isArray } from "../../array"
import { ifDefined } from "../../nullish"
import { doesExtend, isRecord } from "../../object/refinement"
import {
  isLiteral,
  isWithin,
  couldBe,
  isIntersection,
  isUnion,
} from "../../refinement"
import type { Refined } from "../../refinement/refined"

/* eslint-disable max-lines */

export const JSON_SCHEMA_TYPE_NAMES = [...JSON_TYPE_NAMES, `integer`] as const
export type JsonSchemaTypeName = (typeof JSON_SCHEMA_TYPE_NAMES)[number]

export const JSON_SCHEMA_META_TYPE_NAMES = [
  ...JSON_SCHEMA_TYPE_NAMES,
  `any`,
  `never`,
] as const
export type JsonSchemaMetaTypeName = (typeof JSON_SCHEMA_META_TYPE_NAMES)[number]

export type JsonSchemaRef = {
  $ref: string
}
export function isJsonSchemaRef(input: unknown): input is JsonSchemaRef {
  return doesExtend({
    $ref: isString,
  })(input)
}

export type Reffed<
  T extends ReadonlyArray<unknown> | { [key: string]: unknown }
> = T extends ReadonlyArray<unknown>
  ? JsonSchemaRef | T[number]
  : {
      [K in keyof T]: K extends `type`
        ? T[K]
        : T[K] extends { [key: string]: unknown }
        ? JsonSchemaRef | Reffed<T[K]>
        : T[K] extends ReadonlyArray<any>
        ? JsonSchemaRef | Reffed<T[K]>
        : JsonSchemaRef | T[K]
    }

export interface JsonSchemaSystem extends Record<JsonSchemaMetaTypeName, any> {
  array: ArraySchema
  boolean: BooleanSchema
  integer: IntegerSchema
  null: NullSchema
  number: NumberSchema
  object: ObjectSchema
  string: StringSchema
  any: true
  never: false
}

export const JSON_SCHEMA_SYSTEM: JsonSchemaSystem = {
  array: { type: `array` },
  boolean: { type: `boolean` },
  integer: { type: `integer` },
  null: { type: `null` },
  number: { type: `number` },
  object: { type: `object` },
  string: { type: `string` },
  any: true,
  never: false,
} as const

export const JSON_SCHEMA_REFINERY: {
  [K in JsonSchemaMetaTypeName]: Refinement<unknown, JsonSchemaSystem[K]>
} = {
  array: isArraySchema,
  boolean: isBooleanSchema,
  integer: isIntegerSchema,
  null: isNullSchema,
  number: isNumberSchema,
  object: isObjectSchema,
  string: isStringSchema,
  any: isLiteral(true),
  never: isLiteral(false),
}

export const JSON_SCHEMA_LOGIC_OPERATORS = [
  `allOf`,
  `anyOf`,
  `oneOf`,
  `not`,
  `if`,
  `then`,
  `else`,
  `dependentSchemas`,
] as const

// export interface

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

export const numberSchemaStructure = {
  type: isLiteral(`number`),
  enum: ifDefined(isArray(isNumber)),
  minimum: ifDefined(isNumber),
  maximum: ifDefined(isNumber),
  exclusiveMinimum: ifDefined(isNumber),
  exclusiveMaximum: ifDefined(isNumber),
  multipleOf: ifDefined(isNumber),
}
export type NumberSchema = Refined<typeof numberSchemaStructure>
export function isNumberSchema(input: unknown): input is NumberSchema {
  return doesExtend(numberSchemaStructure)(input)
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
export type IntegerSchema = Refined<typeof integerSchemaStructure>
export function isIntegerSchema(input: unknown): input is IntegerSchema {
  return doesExtend(integerSchemaStructure)(input)
}

export const booleanSchemaStructure = {
  type: isLiteral(`boolean`),
  enum: ifDefined(isArray(isBoolean)),
}
export type BooleanSchema = Refined<typeof booleanSchemaStructure>
export function isBooleanSchema(input: unknown): input is BooleanSchema {
  return doesExtend(booleanSchemaStructure)(input)
}

export const nullSchemaStructure = {
  type: isLiteral(`null`),
}
export type NullSchema = Refined<typeof nullSchemaStructure>
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

export type UnionSchema = { anyOf: (JsonSchema | JsonSchemaRef)[] }
export const unionSchemaStructure = {
  anyOf: isArray(couldBe(isJsonSchema).or(isJsonSchemaRef)),
}
export function isUnionSchema(input: unknown): input is UnionSchema {
  return doesExtend(unionSchemaStructure)(input)
}

export type JsonSchemaCore =
  | ArraySchema
  | BooleanSchema
  | IntegerSchema
  | MixedSchema
  | NullSchema
  | NumberSchema
  | ObjectSchema
  | StringSchema
  | UnionSchema

export const isJsonSchemaCore = isUnion
  .or(isArraySchema)
  .or(isBooleanSchema)
  .or(isIntegerSchema)
  .or(isNullSchema)
  .or(isNumberSchema)
  .or(isObjectSchema)
  .or(isStringSchema)
  .or(isMixedSchema)
  .or(isUnionSchema)

export type JsonSchemaLeaf =
  | BooleanSchema
  | IntegerSchema
  | NullSchema
  | NumberSchema
  | StringSchema
export function isJsonSchemaLeaf(input: unknown): input is JsonSchemaLeaf {
  return isUnion
    .or(isBooleanSchema)
    .or(isIntegerSchema)
    .or(isNullSchema)
    .or(isNumberSchema)
    .or(isStringSchema)(input)
}

export type JsonSchemaTree =
  | ArraySchema
  | MixedSchema
  | ObjectSchema
  | UnionSchema
export function isJsonSchemaTree(input: unknown): input is JsonSchemaTree {
  return isUnion
    .or(isArraySchema)
    .or(isMixedSchema)
    .or(isObjectSchema)
    .or(isUnionSchema)(input)
}

export type JsonSchemaRoot = {
  $id?: string
  $schema?: string
  definitions?: Record<string, JsonSchema>
}

export const isJsonSchemaRoot = doesExtend({
  $id: ifDefined(isString),
  $schema: ifDefined(isString),
})

/* prettier-ignore */
export type JsonSchemaObject = 
    & JsonSchemaCore
    & JsonSchemaRoot
export const isJsonSchemaObject = isIntersection
  .and(isJsonSchemaCore)
  .and(isJsonSchemaRoot)

export type JsonSchema = JsonSchemaObject | boolean
export function isJsonSchema(input: unknown): input is JsonSchema {
  return couldBe(isJsonSchemaObject).or(isBoolean)(input)
}
