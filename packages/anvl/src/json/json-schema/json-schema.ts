/* eslint-disable max-lines */
import { isBoolean } from "fp-ts/boolean"
import { pipe } from "fp-ts/function"
import { isNumber } from "fp-ts/number"
import type { Refinement } from "fp-ts/Refinement"
import { isString } from "fp-ts/string"

import { JSON_TYPE_NAMES } from ".."
import { isArray } from "../../array"
import { ifDefined } from "../../nullish"
import {
  delve,
  doesExtend,
  hasProperties,
  isPlainObject,
  isRecord,
  mob,
  modify,
  select,
  tweak,
} from "../../object"
import { deepMob } from "../../object/deepMob"
import { sprawl } from "../../object/sprawl"
import {
  couldBe,
  isIntersection,
  isLiteral,
  isWithin,
  isUnion,
} from "../../refinement"

export type IntegerBrand = {
  readonly integer: unique symbol // totally virtual
}
export type integer = IntegerBrand & number
export const isInteger = (input: unknown): input is integer =>
  Number.isInteger(input as number)

export const parseInt = (input: unknown): integer => {
  if (isInteger(input)) return input
  throw new IntegerParseError(input)
}

export class Fraction extends Number {
  public readonly numerator: integer
  public readonly denominator: integer

  public constructor(n: integer | number, d: integer | number) {
    super(n / d)
    if (d === 0) {
      throw new Error(`Denominator cannot be zero`)
    }
    this.numerator = parseInt(n)
    this.denominator = parseInt(d)
  }
  public readonly [Symbol.toPrimitive]: () => number = () =>
    this.numerator / this.denominator
}
export const isFraction = (input: unknown): input is Fraction =>
  input instanceof Fraction

export class IntegerParseError extends Error {
  public constructor(value: unknown) {
    super(`Could not parse integer from ${JSON.stringify(value)}`)
  }
}

export type IntegerParseResult =
  | {
      value: integer
      error: null
      round: null
      upper: null
      lower: null
      ratio: null
    }
  | {
      value: null
      error: IntegerParseError
      round: integer
      upper: integer
      lower: integer
      ratio: Fraction | null
    }

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

export const isJsonSchemaCore = isUnion
  .or(isArraySchema)
  .or(isBooleanSchema)
  .or(isIntegerSchema)
  .or(isNullSchema)
  .or(isNumberSchema)
  .or(isObjectSchema)
  .or(isStringSchema)
  .or(isMixedSchema)

export type JsonSchemaRoot = {
  $id?: string
  $schema?: string
  definitions?: Record<string, JsonSchema>
}

export const isJsonSchemaRoot = doesExtend({
  $id: ifDefined(isString),
  $schema: ifDefined(isString),
  type: couldBe(isWithin(JSON_SCHEMA_TYPES)).or(
    isArray(isWithin(JSON_SCHEMA_TYPES))
  ),
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
        result.type.map((type) => {
          switch (type) {
            case `array`:
              return pipe(
                result,
                select(
                  `$id`,
                  `$schema`,
                  `type`,
                  `items`,
                  `maxItems`,
                  `minItems`,
                  `uniqueItems`
                ),
                modify({
                  type: `array`,
                } as const)
              )
            case `boolean`:
              return pipe(
                result,
                ({ $id }) => ({ $id }),
                select(`$id`, `$schema`, `type`, `enum`),
                ({ $id, $schema, type, enum: e }) =>
                  modify({
                    type: `boolean`,
                    enum: (e: ReadonlyArray<JsonSchemaType> | unknown) =>
                      e.filter(isBoolean),
                  } as const)(a)
              )
          }
        })
      }
    }
  }
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

export function asNumber(input: Fraction | integer | number): number
export function asNumber(input: Fraction[] | integer[] | number[]): number[]
export function asNumber<
  R extends Record<
    keyof any,
    Fraction | Fraction[] | integer | integer[] | number[] | number
  >
>(
  input: R
): {
  [K in keyof R]: R[K] extends Fraction | integer | number ? number : number[]
}
export function asNumber(input: unknown): unknown {
  return input as any
}

export const a = asNumber(new Fraction(1, 2))
export const b = asNumber([new Fraction(1, 2)])
export const c = asNumber({ a: new Fraction(1, 2) })

export const Int = Object.assign((input: unknown) => parseInt(input), {
  from: (input: unknown): IntegerParseResult =>
    pipe(input, String, parseFloat, (num) =>
      isInteger(num)
        ? {
            value: num,
            error: null,
            round: null,
            upper: null,
            lower: null,
            ratio: null,
          }
        : {
            value: null,
            error: new IntegerParseError(input),
            round: Math.round(num) as integer,
            upper: Math.ceil(num) as integer,
            lower: Math.floor(num) as integer,
            ratio: null,
          }
    ),

  formula: <
    I extends Record<
      keyof any,
      Fraction | Fraction[] | integer | integer[] | number[] | number
    >,
    O extends Record<
      keyof any,
      Fraction | Fraction[] | integer | integer[] | number[] | number
    >
  >(
    fm: (input: {
      [K in keyof I]: I[K] extends (Fraction | integer)[] ? number[] : number
    }) => O
  ) => {
    return (input: I): O => {
      return fm(
        input as {
          [K in keyof I]: I[K] extends (Fraction | integer)[] ? number[] : number
        }
      )
    }
  },
})

export type JsonSchemaStringFormat = (typeof JSON_SCHEMA_STRING_FORMATS)[number]

export type StringSchema = {
  type: `string`
  enum?: string[]
  minLength?: number
  maxLength?: number
  pattern?: string
  format?: JsonSchemaStringFormat
}
export function isStringSchema(input: unknown): input is StringSchema {
  return doesExtend({
    type: isLiteral(`string`),
    enum: ifDefined(isArray(isString)),
    minLength: ifDefined(isNumber),
    maxLength: ifDefined(isNumber),
    pattern: ifDefined(isString),
    format: ifDefined(isWithin(JSON_SCHEMA_STRING_FORMATS)),
  })(input)
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
export function isNumberSchema(input: unknown): input is NumberSchema {
  return doesExtend({
    type: isLiteral(`number`),
    enum: ifDefined(isArray(isNumber)),
    minimum: ifDefined(isNumber),
    maximum: ifDefined(isNumber),
    exclusiveMinimum: ifDefined(isNumber),
    exclusiveMaximum: ifDefined(isNumber),
    multipleOf: ifDefined(isNumber),
  })(input)
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
export function isIntegerSchema(input: unknown): input is IntegerSchema {
  return doesExtend({
    type: isLiteral(`integer`),
    enum: ifDefined(isArray(isInteger)),
    minimum: ifDefined(isInteger),
    maximum: ifDefined(isInteger),
    exclusiveMinimum: ifDefined(isInteger),
    exclusiveMaximum: ifDefined(isInteger),
    multipleOf: ifDefined(isInteger),
  })(input)
}

export type BooleanSchema = {
  type: `boolean`
  enum?: boolean[]
}
export function isBooleanSchema(input: unknown): input is BooleanSchema {
  return doesExtend({
    type: isLiteral(`boolean`),
    enum: ifDefined(isArray(isBoolean)),
  })(input)
}

export type NullSchema = {
  type: `null`
}
export function isNullSchema(input: unknown): input is NullSchema {
  return doesExtend({
    type: isLiteral(`null`),
  })(input)
}

export type ObjectSchema = {
  type: `object`
  properties?: Record<string, JsonSchema>
  required?: string[]
  additionalProperties?: boolean | { type: JsonSchemaType }
  minProperties?: number
  maxProperties?: number
}

export function isObjectSchema(input: unknown): input is ObjectSchema {
  return doesExtend({
    type: isLiteral(`object`),
    properties: ifDefined(
      isRecord(isString, isUnion.or(isJsonSchemaCore).or(isJsonSchemaRef))
    ),
    required: ifDefined(isArray(isString)),
    additionalProperties: ifDefined(
      isUnion.or(isBoolean).or(
        doesExtend({
          type: isWithin(JSON_SCHEMA_TYPES),
        })
      )
    ),
    minProperties: ifDefined(isNumber),
    maxProperties: ifDefined(isNumber),
  })(input)
}

export type ArraySchema = {
  type: `array`
  items?: JsonSchema
  minItems?: number
  maxItems?: number
  uniqueItems?: boolean
}

export function isArraySchema(input: unknown): input is ArraySchema {
  return doesExtend({
    type: isLiteral(`array`),
    items: ifDefined(isUnion.or(isJsonSchemaCore).or(isArray(isJsonSchemaRef))),
    minItems: ifDefined(isNumber),
    maxItems: ifDefined(isNumber),
    uniqueItems: ifDefined(isBoolean),
  })(input)
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

export function isMixedSchema(input: unknown): input is MixedSchema {
  return doesExtend({
    type: isArray(isWithin(JSON_SCHEMA_TYPES)),
    enum: ifDefined(
      isArray(isUnion.or(isNumber).or(isString).or(isBoolean).or(isInteger))
    ),
    items: ifDefined(isUnion.or(isJsonSchemaCore).or(isArray(isJsonSchemaRef))),
    minItems: ifDefined(isNumber),
    maxItems: ifDefined(isNumber),
    uniqueItems: ifDefined(isBoolean),
    properties: ifDefined(
      isRecord(isString, isUnion.or(isJsonSchemaCore).or(isJsonSchemaRef))
    ),
    required: ifDefined(isArray(isString)),
    additionalProperties: ifDefined(
      isUnion.or(isBoolean).or(
        doesExtend({
          type: isWithin(JSON_SCHEMA_TYPES),
        })
      )
    ),
    minProperties: ifDefined(isNumber),
    maxProperties: ifDefined(isNumber),
    minLength: ifDefined(isNumber),
    maxLength: ifDefined(isNumber),
    pattern: ifDefined(isString),
    format: ifDefined(isWithin(JSON_SCHEMA_STRING_FORMATS)),
    minimum: ifDefined(isNumber),
    maximum: ifDefined(isNumber),
    exclusiveMinimum: ifDefined(isNumber),
    exclusiveMaximum: ifDefined(isNumber),
    multipleOf: ifDefined(isNumber),
  })(input)
}
