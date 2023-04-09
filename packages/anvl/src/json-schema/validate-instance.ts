import { isBoolean } from "fp-ts/boolean"
import { pipe } from "fp-ts/lib/function"
import { isNumber } from "fp-ts/number"
import type { Refinement } from "fp-ts/Refinement"
import { isString } from "fp-ts/string"

import type { integer } from "./integer"
import { isInteger } from "./integer"
import {
  isArraySchema,
  isConditionalSchema,
  isExclusiveSchema,
  isIntersectionSchema,
  isJsonSchemaLeaf,
  isJsonSchemaTree,
  isNegationSchema,
  isObjectSchema,
  isUnionSchema,
} from "./json-schema"
import type {
  JsonSchema,
  JsonSchemaMetaTypeName,
  JsonSchemaSystem,
  JsonSchemaTypeName,
  JsonSchemaLeaf,
  JsonSchemaLogicMode,
  JsonSchemaTree,
  ArraySchema,
  ObjectSchema,
} from "./json-schema"
import { isJsonSchemaRef, retrieveRef } from "./refs"
import { filter } from "../array"
import { isNull } from "../nullish"
import type { Fragment } from "../object/patch"
import { isPlainObject } from "../object/refinement"
import { canExist, cannotExist } from "../refinement"

/* eslint-disable max-lines */

export interface JsonSchemaMetaTypes
  extends Record<JsonSchemaMetaTypeName, any> {
  integer: integer
  number: number
  string: string
  boolean: boolean
  null: null
  array: any[]
  object: Record<string, any>
  any: any
  never: never
}

export const JSON_SCHEMA_META_REFINERY: {
  [TypeName in JsonSchemaMetaTypeName]: Refinement<
    unknown,
    JsonSchemaMetaTypes[TypeName]
  >
} = {
  integer: isInteger,
  number: isNumber,
  string: isString,
  boolean: isBoolean,
  null: isNull,
  array: Array.isArray,
  object: isPlainObject,
  any: canExist,
  never: cannotExist,
}

export const TREE_KEYWORDS = [
  `properties`,
  `patternProperties`,
  `additionalProperties`,
  `dependentSchemas`,
  `items`,
  `additionalItems`,
  `contains`,
] as const

export const validateAsType: {
  [Name in JsonSchemaTypeName]: {
    [Keyword in keyof Required<JsonSchemaSystem[Name]>]: Keyword extends `type`
      ? (v?: Name) => (typeof JSON_SCHEMA_META_REFINERY)[Name]
      : (options: {
          spec: Required<JsonSchemaSystem[Name]>[Keyword]
          refMap: Record<string, JsonSchema>
          root: JsonSchema
        }) => (instance: JsonSchemaMetaTypes[Name]) => boolean
  }
} = {
  integer: {
    type: () => JSON_SCHEMA_META_REFINERY.integer,
    enum: (opts) => (instance) => opts.spec.includes(instance),
    minimum: (opts) => (instance) => instance >= opts.spec,
    maximum: (opts) => (instance) => instance <= opts.spec,
    exclusiveMinimum: (opts) => (instance) => instance > opts.spec,
    exclusiveMaximum: (opts) => (instance) => instance < opts.spec,
    multipleOf: (opts) => (instance) => instance % opts.spec === 0,
  },
  number: {
    type: () => JSON_SCHEMA_META_REFINERY.number,
    enum: (opts) => (instance) => opts.spec.includes(instance),
    minimum: (opts) => (instance) => instance >= opts.spec,
    maximum: (opts) => (instance) => instance <= opts.spec,
    exclusiveMinimum: (opts) => (instance) => instance > opts.spec,
    exclusiveMaximum: (opts) => (instance) => instance < opts.spec,
    multipleOf: (opts) => (instance) => instance % opts.spec === 0,
  },
  string: {
    type: () => JSON_SCHEMA_META_REFINERY.string,
    enum: (opts) => (instance) => opts.spec.includes(instance),
    minLength: (opts) => (instance) => instance.length >= opts.spec,
    maxLength: (opts) => (instance) => instance.length <= opts.spec,
    pattern: (opts) => (instance) => new RegExp(opts.spec).test(instance),
    format: (_) => (_) => true,
  },
  boolean: {
    type: () => JSON_SCHEMA_META_REFINERY.boolean,
    enum: (opts) => (instance) => opts.spec.includes(instance),
  },
  null: {
    type: () => JSON_SCHEMA_META_REFINERY.null,
  },
  array: {
    type: () => JSON_SCHEMA_META_REFINERY.array,
    items: (_) => (_) => true, // TODO
    minItems: (opts) => (instance) => instance.length >= opts.spec,
    maxItems: (opts) => (instance) => instance.length <= opts.spec,
    uniqueItems: (opts) => (instance) =>
      opts.spec === false || new Set(instance).size === instance.length,
  },
  object: {
    type: () => JSON_SCHEMA_META_REFINERY.object,
    properties: (opts) => (instance) => {
      console.log(`> properties`)
      console.log({ opts, instance })
      const propertyNames = Object.keys(opts.spec)
      return propertyNames.every((propertyName) => {
        const propertySchema = opts.spec[propertyName]
        console.log(`> property "${propertyName}"`)
        console.log({
          propertyName,
          propertySchema,
          instanceProperty: instance[propertyName],
        })
        return propertyName in instance
          ? validateBy(
              propertySchema,
              opts.refMap,
              opts.root
            )(instance[propertyName]).isValid
          : true
      })
    },
    required: (opts) => (instance) => opts.spec.every((key) => key in instance),
    propertyNames: (_) => (_) => true, // TODO
    patternProperties: (_) => (_) => true, // TODO
    minProperties: (opts) => (instance) =>
      Object.keys(instance).length >= opts.spec,
    maxProperties: (opts) => (instance) =>
      Object.keys(instance).length <= opts.spec,
    additionalProperties: (_) => (_) => true, // TODO
    dependentSchemas: (_) => (_) => true, // TODO
  },
}

export const validateByLogicMode: {
  [LogicMode in JsonSchemaLogicMode]: (options: {
    schema: JsonSchemaSystem[LogicMode]
    refMap: Record<string, JsonSchema>
    root: JsonSchema
  }) => (instance: unknown) => InstanceValidationResult
} = {
  union: (opts) => (instance) => {
    const validationResults = (
      opts.schema.anyOf as ReadonlyArray<JsonSchema>
    ).map((schema) => validateBy(schema)(instance))
    const isValid = validationResults.some((result) => result.isValid)
    const violations: InstanceValidationResult[`violations`] = isValid
      ? []
      : [
          {
            instance,
            schema: {
              anyOf: validationResults.flatMap((result) =>
                result.violations.map(({ schema }) => schema)
              ),
            },
          },
        ]

    return { isValid, violations }
  },
  exclusive: (opts) => (instance) => {
    const validationResults = (
      opts.schema.oneOf as ReadonlyArray<JsonSchema>
    ).map((schema) => validateBy(schema)(instance))
    const validResults = validationResults.filter((result) => result.isValid)
    const isValid = validResults.length === 1

    const violations: InstanceValidationResult[`violations`] = isValid
      ? []
      : [
          {
            instance,
            schema: {
              oneOf:
                validResults.length === 0
                  ? validationResults.flatMap((result) =>
                      result.violations.map(({ schema }) => schema)
                    )
                  : (opts.schema.oneOf as ReadonlyArray<JsonSchema>),
            },
            problem: `${
              validationResults.filter((result) => result.isValid).length
            } of these ${
              opts.schema.oneOf.length
            } schemas were able to validate the instance`,
          },
        ]
    return { isValid, violations }
  },
  intersection: (opts) => (instance) => {
    const validationResults = (
      opts.schema.allOf as ReadonlyArray<JsonSchema>
    ).map((schema) => validateBy(schema)(instance))
    const isValid = validationResults.every((result) => result.isValid)
    const violations: InstanceValidationResult[`violations`] = isValid
      ? []
      : [
          {
            instance,
            schema: {
              allOf: validationResults.flatMap((result) =>
                result.violations.map(({ schema }) => schema)
              ),
            },
          },
        ]
    return { isValid, violations }
  },
  negation: (opts) => (instance) => {
    const validationResult = validateBy(opts.schema.not)(instance)
    const isValid = !validationResult.isValid
    const violations: InstanceValidationResult[`violations`] = isValid
      ? []
      : [
          {
            instance,
            schema: {
              not: opts.schema.not,
            },
          },
        ]
    return { isValid, violations }
  },
  conditional: (opts) => (instance) => {
    if (`then` in opts.schema || `else` in opts.schema) {
      const ifResult = validateBy(opts.schema.if)(instance)
      if (ifResult.isValid && `then` in opts.schema) {
        const thenResult = validateBy(opts.schema.then)(instance)
        const violations: InstanceValidationResult[`violations`] =
          thenResult.isValid
            ? []
            : [
                {
                  instance,
                  schema: {
                    if: opts.schema.if,
                    then: thenResult.violations[0].schema,
                  },
                },
              ]
        return { isValid: thenResult.isValid, violations }
      } else if (!ifResult.isValid && `else` in opts.schema) {
        const elseResult = validateBy(opts.schema.else)(instance)
        const violations: InstanceValidationResult[`violations`] =
          elseResult.isValid
            ? []
            : [
                {
                  instance,
                  schema: {
                    if: opts.schema.if,
                    else: elseResult.violations[0].schema,
                  },
                },
              ]
        return { isValid: elseResult.isValid, violations }
      }
    }
    return { isValid: true, violations: [] }
  },
}

type InstanceFailure = {
  instance: unknown
  schema: Fragment<JsonSchema>
  problem?: `${number} of these ${number} schemas were able to validate the instance`
}
type InstanceValidationResult = {
  isValid: boolean
  violations: InstanceFailure[]
}

export const collectPropertyViolations =
  <Schema extends ObjectSchema>(
    schema: Schema,
    refMap: Record<string, JsonSchema>,
    root: JsonSchema
  ) =>
  (instance: unknown): InstanceValidationResult => {
    const violations: InstanceFailure[] = []
    if (schema.properties && isPlainObject(instance)) {
      const isValid = Object.entries(schema.properties).every(
        ([key, propertySchema]) => {
          const propertyInstance = (instance as Record<string, unknown>)[key]
          const validationResult = validateBy(propertySchema)({
            instance: propertyInstance,
            refMap,
            root,
          })
          if (!validationResult.isValid) {
            violations.push({
              instance: propertyInstance,
              schema: validationResult.violations[0].schema,
            })
          }
          return validationResult.isValid
        }
      )
      return { isValid, violations }
    }
    return { isValid: true, violations: [] }
  }

export const validateLeaf =
  <Schema extends ArraySchema | JsonSchemaLeaf | ObjectSchema>(
    schema: Schema,
    refMap: Record<string, JsonSchema>,
    root: JsonSchema
  ): ((instance: unknown) => InstanceValidationResult) =>
  (instance): InstanceValidationResult => {
    console.log(`> validateLeaf`)
    console.log({ instance, schema, refMap, root })
    const check = validateAsType[schema.type]
    const passesValidation = Object.entries(schema).every(([keyword, spec]) =>
      keyword in check ? check[keyword]({ spec, refMap, root })(instance) : true
    )
    if (passesValidation) return { isValid: true, violations: [] }
    const { type, ...rest } = schema
    const failedConstraints: Fragment<JsonSchema> = JSON_SCHEMA_META_REFINERY[
      type
    ](instance)
      ? pipe(
          Object.entries(rest),
          filter<[keyof any, any], [keyof any, any]>(
            (entry): entry is [keyof any, any] => {
              const [keyword, spec] = entry
              return (
                keyword in check &&
                !check[keyword]({ spec, refMap, root })(instance)
              )
            }
          ),
          Object.fromEntries
        )
      : { type }
    return {
      isValid: false,
      violations: [{ instance, schema: failedConstraints }],
    }
  }

export const validateLogic =
  <Schema extends JsonSchemaTree>(
    schema: Schema,
    refMap: Record<string, JsonSchema>,
    root: JsonSchema
  ): ((instance: unknown) => InstanceValidationResult) =>
  (instance): InstanceValidationResult => {
    if (isUnionSchema(schema)) {
      return validateByLogicMode.union({ schema, refMap, root })(instance)
    }
    if (isExclusiveSchema(schema)) {
      return validateByLogicMode.exclusive({ schema, refMap, root })(instance)
    }
    if (isIntersectionSchema(schema)) {
      return validateByLogicMode.intersection({ schema, refMap, root })(instance)
    }
    if (isNegationSchema(schema)) {
      return validateByLogicMode.negation({ schema, refMap, root })(instance)
    }
    if (isConditionalSchema(schema)) {
      return validateByLogicMode.conditional({ schema, refMap, root })(instance)
    }
    throw new Error(`not implemented`)
  }

export function validateBy(
  schema: unknown,
  refMap: Record<string, JsonSchema> = {},
  root: JsonSchema = schema as JsonSchema
): (instance: unknown) => InstanceValidationResult {
  const validateInstance = (instance: unknown): InstanceValidationResult => {
    console.log(`> validateBy`)
    console.log({ instance, schema, refMap, root })
    if (schema === true) return { isValid: true, violations: [] }
    if (schema === false) {
      return { isValid: false, violations: [{ instance, schema }] }
    }
    if (isJsonSchemaRef(schema)) {
      console.log(`> isJsonSchemaRef`)
      const { node, refMap: newRefMap } = retrieveRef({
        refNode: schema,
        refMap,
        root,
      })
      console.log({ node, newRefMap })
      return validateBy(node, newRefMap, root)(instance)
    }
    if (
      isJsonSchemaLeaf(schema) ||
      isObjectSchema(schema) ||
      isArraySchema(schema)
    ) {
      return validateLeaf(schema, refMap, root)(instance)
    }
    if (isJsonSchemaTree(schema)) {
      return validateLogic(schema, refMap, root)(instance)
    }
    throw new Error(`not implemented`)
  }
  return validateInstance
}
