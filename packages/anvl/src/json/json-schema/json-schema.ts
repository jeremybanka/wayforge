/* eslint-disable max-lines */
import { isBoolean } from "fp-ts/boolean"
import type { Refinement } from "fp-ts/Refinement"
import { isString } from "fp-ts/string"

import type {
  ArraySchema,
  BooleanSchema,
  IntegerSchema,
  MixedSchema,
  NullSchema,
  NumberSchema,
  ObjectSchema,
  StringSchema,
  UnionSchema,
} from "./typed-schemas"
import {
  isArraySchema,
  isBooleanSchema,
  isIntegerSchema,
  isMixedSchema,
  isNullSchema,
  isNumberSchema,
  isObjectSchema,
  isStringSchema,
  isUnionSchema,
} from "./typed-schemas"
import { JSON_TYPE_NAMES } from ".."
import { ifDefined } from "../../nullish"
import { doesExtend } from "../../object"
import { couldBe, isIntersection, isLiteral, isUnion } from "../../refinement"

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
export const isJsonSchemaRef = doesExtend({
  $ref: isString,
})

export type Reffed<
  T extends ReadonlyArray<unknown> | { [key: string]: unknown }
> = T extends ReadonlyArray<unknown>
  ? JsonSchemaRef | T[number]
  : {
      [K in keyof T]: K extends `type`
        ? T[K]
        : T[K] extends { [key: string]: unknown }
        ? JsonSchemaRef | Reffed<T[K]>
        : T[K] extends ReadonlyArray<unknown>
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

export type JsonSchema = Reffed<JsonSchemaObject> | boolean
export const isJsonSchema = couldBe(isJsonSchemaObject).or(isBoolean)

type OptionalPropertyOf<T extends object> = Exclude<
  {
    [K in keyof T]: T extends Record<K, T[K]> ? never : K
  }[keyof T],
  undefined
>
export type OptionalsOfMixedSchema = OptionalPropertyOf<MixedSchema>
