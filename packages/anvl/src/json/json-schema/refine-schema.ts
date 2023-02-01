import { isBoolean } from "fp-ts/boolean"
import { pipe } from "fp-ts/function"
import { isNumber } from "fp-ts/number"
import { isString } from "fp-ts/string"

import { dereference } from "./dereference"
import { isInteger } from "./integer"
import type {
  JsonSchemaRoot,
  ArraySchema,
  BooleanSchema,
  IntegerSchema,
  MixedSchema,
  NullSchema,
  ObjectSchema,
  StringSchema,
  NumberSchema,
} from "./json-schema"
import {
  isJsonSchemaRoot,
  JSON_SCHEMA_TYPE_NAMES,
  isArraySchema,
  isBooleanSchema,
  isIntegerSchema,
  isMixedSchema,
  isNullSchema,
  isNumberSchema,
  isObjectSchema,
  isStringSchema,
} from "./json-schema"
import { isArray } from "../../array"
import { doesExtend, modify, select } from "../../object"
import { couldBe, isWithin } from "../../refinement"

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

export const refineJsonSchema = (
  input: unknown
): (Error | RefinedJsonSchema)[] => {
  if (input === true) return [{ type: `any`, data: true }]
  if (input === false) return [{ type: `never`, data: false }]
  if (doesExtend({ type: couldBe(isString).or(isArray(isString)) })(input)) {
    const result = dereference(input)
    if (isJsonSchemaRoot(result)) {
      if (isWithin(JSON_SCHEMA_TYPE_NAMES)(result.type)) {
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
