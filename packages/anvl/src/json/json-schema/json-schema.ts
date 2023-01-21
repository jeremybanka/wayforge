/* eslint-disable max-lines */
import { isBoolean } from "fp-ts/boolean"
import { pipe } from "fp-ts/function"
import { isNumber } from "fp-ts/number"
import type { Refinement } from "fp-ts/Refinement"
import { isString } from "fp-ts/string"

import type { integer } from "./integer"
import { isInteger } from "./integer"
import { JSON_TYPE_NAMES } from ".."
import { isArray } from "../../array"
import { ifDefined } from "../../nullish"
import { delve, doesExtend, isRecord, modify, select, tweak } from "../../object"
import { deepMob } from "../../object/deepMob"
import { sprawl } from "../../object/sprawl"
import {
  couldBe,
  isIntersection,
  isLiteral,
  isWithin,
  isUnion,
} from "../../refinement"

export const JSON_SCHEMA_TYPES = [...JSON_TYPE_NAMES, `integer`] as const
export type JsonSchemaType = (typeof JSON_SCHEMA_TYPES)[number]

export const JSON_SCHEMA_META_TYPES = [
  ...JSON_SCHEMA_TYPES,
  `any`,
  `never`,
] as const
export type JsonSchemaMetaType = (typeof JSON_SCHEMA_META_TYPES)[number]

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

export interface JsonSchemaSystem extends Record<JsonSchemaMetaType, any> {
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
  [K in JsonSchemaMetaType]: Refinement<unknown, JsonSchemaSystem[K]>
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

export type RefinedJsonSchema =
  | { type: `any`; data: true }
  | { type: `array`; data: ArraySchema & JsonSchemaRoot }
  | { type: `boolean`; data: BooleanSchema & JsonSchemaRoot }
  | { type: `integer`; data: IntegerSchema & JsonSchemaRoot }
  | { type: `never`; data: false }
  | { type: `null`; data: JsonSchemaRoot & NullSchema }
  | { type: `number`; data: JsonSchemaRoot & NumberSchema }
  | { type: `object`; data: JsonSchemaRoot & ObjectSchema }
  | { type: `string`; data: JsonSchemaRoot & StringSchema }

export const dereference = <T extends Array<any> | { [key: keyof any]: any }>(
  input: T
): T => {
  const result: T = deepMob(input)
  sprawl(result, (path, node) => {
    if (path.length === 0) return
    // console.log({ path, node })
    if (path.at(-1) === `$ref` && typeof node === `string`) return
    tweak(result, path, node)
    if (isJsonSchemaRef(node)) {
      const ref = node.$ref
      // console.log({ ref })
      const [_, ...refPath] = ref.split(`/`)
      const refNode = delve(result, refPath)
      // console.log({ refPath, refNode })
      if (!(refNode instanceof Error)) {
        tweak(result, path, refNode.found)
      }
      // console.log({ result })
    }
  })
  return result
}

export const refineJsonSchema = (
  input: unknown
): (Error | RefinedJsonSchema)[] => {
  if (input === true) return [{ type: `any`, data: true }]
  if (input === false) return [{ type: `never`, data: false }]
  if (doesExtend({ type: couldBe(isString).or(isArray(isString)) })(input)) {
    const result = dereference(input)
    if (isJsonSchemaRoot(result)) {
      if (isWithin(JSON_SCHEMA_TYPES)(result.type)) {
        switch (result.type) {
          case `array`: {
            if (isArraySchema(result)) {
              return [{ type: `array`, data: result }]
            }
            return [new Error(`Invalid array schema`)]
          }
          case `boolean`: {
            if (isBooleanSchema(result)) {
              return [{ type: `boolean`, data: result }]
            }
            return [new Error(`Invalid boolean schema`)]
          }
          case `integer`: {
            if (isIntegerSchema(result)) {
              return [{ type: `integer`, data: result }]
            }
            return [new Error(`Invalid integer schema`)]
          }
          case `null`: {
            if (isNullSchema(result)) {
              return [{ type: `null`, data: result }]
            }
            return [new Error(`Invalid null schema`)]
          }
          case `number`: {
            if (isNumberSchema(result)) {
              return [{ type: `number`, data: result }]
            }
            return [new Error(`Invalid number schema`)]
          }
          case `object`: {
            if (isObjectSchema(result)) {
              return [{ type: `object`, data: result }]
            }
            return [new Error(`Invalid object schema`)]
          }
          case `string`: {
            if (isStringSchema(result)) {
              return [{ type: `string`, data: result }]
            }
            return [new Error(`Invalid string schema`)]
          }
        }
      }
      if (isMixedSchema(result)) {
        const separated: (Error | RefinedJsonSchema)[] = result.type.map(
          (type) => {
            switch (type) {
              case `array`: {
                return {
                  type: `array`,
                  data: pipe(
                    result,
                    select(
                      `$id`,
                      `$schema`,
                      `type`,
                      `items`,
                      `minItems`,
                      `maxItems`,
                      `uniqueItems`
                    ),
                    modify({
                      type: `array`,
                    } as const)
                  ),
                }
              }
              case `boolean`: {
                const data = pipe(
                  result,
                  select(`$id`, `$schema`, `type`, `enum`),
                  modify({
                    type: `boolean`,
                    enum: (e: MixedSchema[`enum`]) => e?.filter(isBoolean),
                  } as const)
                )
                return { data, type: `boolean` }
              }
              case `integer`: {
                const data: IntegerSchema & JsonSchemaRoot = pipe(
                  result,
                  select(
                    `$id`,
                    `$schema`,
                    `type`,
                    `minimum`,
                    `maximum`,
                    `exclusiveMinimum`,
                    `exclusiveMaximum`,
                    `enum`
                  ),
                  modify({
                    type: `integer`,
                    enum: (e: MixedSchema[`enum`]) => e?.filter(isInteger),
                    minimum: (m: MixedSchema[`minimum`]) =>
                      isInteger(m) ? m : undefined,
                    maximum: (m: MixedSchema[`maximum`]) =>
                      isInteger(m) ? m : undefined,
                    exclusiveMinimum: (m: MixedSchema[`exclusiveMinimum`]) =>
                      isInteger(m) ? m : undefined,
                    exclusiveMaximum: (m: MixedSchema[`exclusiveMaximum`]) =>
                      isInteger(m) ? m : undefined,
                  } as const)
                )
                return { data, type: `integer` }
              }
              case `null`: {
                const data: JsonSchemaRoot & NullSchema = pipe(
                  result,
                  select(`$id`, `$schema`, `type`, `enum`),
                  modify({
                    type: `null`,
                  } as const)
                )
                return { data, type: `null` }
              }
              case `number`: {
                const data: JsonSchemaRoot & NumberSchema = pipe(
                  result,
                  select(
                    `$id`,
                    `$schema`,
                    `type`,
                    `minimum`,
                    `maximum`,
                    `exclusiveMinimum`,
                    `exclusiveMaximum`,
                    `enum`
                  ),
                  modify({
                    type: `number`,
                    enum: (e: MixedSchema[`enum`]) => e?.filter(isNumber),
                    minimum: (m: MixedSchema[`minimum`]) =>
                      isNumber(m) ? m : undefined,
                    maximum: (m: MixedSchema[`maximum`]) =>
                      isNumber(m) ? m : undefined,
                    exclusiveMinimum: (m: MixedSchema[`exclusiveMinimum`]) =>
                      isNumber(m) ? m : undefined,
                    exclusiveMaximum: (m: MixedSchema[`exclusiveMaximum`]) =>
                      isNumber(m) ? m : undefined,
                  } as const)
                )
                return { data, type: `number` }
              }
              case `object`: {
                const data: JsonSchemaRoot & ObjectSchema = pipe(
                  result,
                  select(
                    `$id`,
                    `$schema`,
                    `type`,
                    `properties`,
                    `required`,
                    `minProperties`,
                    `maxProperties`,
                    `additionalProperties`
                  ),
                  modify({
                    type: `object`,
                  } as const)
                )
                return { data, type: `object` }
              }
              case `string`: {
                const data: JsonSchemaRoot & StringSchema = pipe(
                  result,
                  select(
                    `$id`,
                    `$schema`,
                    `type`,
                    `minLength`,
                    `maxLength`,
                    `pattern`,
                    `format`,
                    `enum`
                  ),
                  modify({
                    type: `string`,
                    enum: (e: MixedSchema[`enum`]) => e?.filter(isString),
                  } as const)
                )
                return { data, type: `string` }
              }
            }
          }
        )
        return separated
      }
    }
  }
  return [new Error(`Invalid schema`)]
}

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
  additionalProperties?:
    | JsonSchema
    | JsonSchemaRef
    | boolean
    | { type: JsonSchemaType }
  minProperties?: number
  maxProperties?: number
}
export const objectSchemaStructure = {
  type: isLiteral(`object`),
  properties: ifDefined(
    isRecord(isString, isUnion.or(isJsonSchema).or(isJsonSchemaRef))
  ),
  required: ifDefined(isArray(isString)),
  additionalProperties: ifDefined(
    isUnion
      .or(isBoolean)
      .or(
        doesExtend({
          type: isWithin(JSON_SCHEMA_TYPES),
        })
      )
      .or(isJsonSchemaRef)
      .or(isJsonSchema)
  ),
  minProperties: ifDefined(isInteger),
  maxProperties: ifDefined(isInteger),
}
export function isObjectSchema(input: unknown): input is ObjectSchema {
  return doesExtend(objectSchemaStructure)(input)
}

export type ArraySchema = {
  type: `array`
  items?: (JsonSchema | JsonSchemaRef)[] | JsonSchema | JsonSchemaRef
  minItems?: number
  maxItems?: number
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
  type: ReadonlyArray<JsonSchemaType>
  enum?: ReadonlyArray<integer | boolean | number | string>
}
export const mixedSchemaStructure = {
  type: isArray(isWithin(JSON_SCHEMA_TYPES)),
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
        type: isWithin(JSON_SCHEMA_TYPES),
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

export type UnionSchema = {
  anyOf: JsonSchema[]
}
export const unionSchemaStructure = {
  anyOf: isArray(isUnion.or(isJsonSchema).or(isJsonSchemaRef)),
}
export function isUnionSchema(input: unknown): input is UnionSchema {
  return doesExtend(unionSchemaStructure)(input)
}

type OptionalPropertyOf<T extends object> = Exclude<
  {
    [K in keyof T]: T extends Record<K, T[K]> ? never : K
  }[keyof T],
  undefined
>
export type OptionalsOfMixedSchema = OptionalPropertyOf<MixedSchema>
