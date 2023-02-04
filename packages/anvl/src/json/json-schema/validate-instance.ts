import { isBoolean } from "fp-ts/boolean"
import { pipe } from "fp-ts/lib/function"
import { isNumber } from "fp-ts/number"
import type { Refinement } from "fp-ts/Refinement"
import { isString } from "fp-ts/string"

import type { integer } from "./integer"
import { isInteger, Int } from "./integer"
import { isJsonSchemaLeaf, isUnionSchema } from "./json-schema"
import type {
  JsonSchema,
  JsonSchemaMetaTypeName,
  JsonSchemaSystem,
  JsonSchemaTypeName,
  JsonSchemaLeaf,
} from "./json-schema"
import { filter } from "../../array"
import { isNull } from "../../nullish"
import { isPlainObject } from "../../object/refinement"
import { canExist, cannotExist } from "../../refinement"

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

export const NEVER = Symbol(`never`)

export const JSON_SCHEMA_META_TYPES: JsonSchemaMetaTypes = {
  integer: Int(0),
  number: 0,
  string: ``,
  boolean: false,
  null: null,
  array: [],
  object: {},
  any: null,
  never: { NEVER } as never,
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

export const validate: {
  [Name in JsonSchemaTypeName]: {
    [KeyWord in keyof Required<JsonSchemaSystem[Name]>]: KeyWord extends `type`
      ? (v?: Name) => (typeof JSON_SCHEMA_META_REFINERY)[Name]
      : (
          spec: Required<JsonSchemaSystem[Name]>[KeyWord]
        ) => (instance: JsonSchemaMetaTypes[Name]) => boolean
  }
} = {
  integer: {
    type: () => JSON_SCHEMA_META_REFINERY.integer,
    enum: (spec) => (instance) => spec.includes(instance),
    minimum: (spec) => (instance) => instance >= spec,
    maximum: (spec) => (instance) => instance <= spec,
    exclusiveMinimum: (spec) => (instance) => instance > spec,
    exclusiveMaximum: (spec) => (instance) => instance < spec,
    multipleOf: (spec) => (instance) => instance % spec === 0,
  },
  number: {
    type: () => JSON_SCHEMA_META_REFINERY.number,
    enum: (spec) => (instance) => spec.includes(instance),
    minimum: (spec) => (instance) => instance >= spec,
    maximum: (spec) => (instance) => instance <= spec,
    exclusiveMinimum: (spec) => (instance) => instance > spec,
    exclusiveMaximum: (spec) => (instance) => instance < spec,
    multipleOf: (spec) => (instance) => instance % spec === 0,
  },
  string: {
    type: () => JSON_SCHEMA_META_REFINERY.string,
    enum: (spec) => (instance) => spec.includes(instance),
    minLength: (spec) => (instance) => instance.length >= spec,
    maxLength: (spec) => (instance) => instance.length <= spec,
    pattern: (spec) => (instance) => new RegExp(spec).test(instance),
    format: (spec) => (instance) => true,
  },
  boolean: {
    type: () => JSON_SCHEMA_META_REFINERY.boolean,
    enum: (spec) => (instance) => spec.includes(instance),
  },
  null: {
    type: () => JSON_SCHEMA_META_REFINERY.null,
  },
  array: {
    type: () => JSON_SCHEMA_META_REFINERY.array,
    items: (spec) => (instance) => true, // TODO
    minItems: (spec) => (instance) => instance.length >= spec,
    maxItems: (spec) => (instance) => instance.length <= spec,
    uniqueItems: (spec) => (instance) =>
      spec === false || new Set(instance).size === instance.length,
  },
  object: {
    type: () => JSON_SCHEMA_META_REFINERY.object,
    properties: (spec) => (instance) => true, // TODO
    required: (spec) => (instance) => spec.every((key) => key in instance),
    propertyNames: (spec) => (instance) => true, // TODO
    minProperties: (spec) => (instance) => Object.keys(instance).length >= spec,
    maxProperties: (spec) => (instance) => Object.keys(instance).length <= spec,
    additionalProperties: (spec) => (instance) => true, // TODO
  },
}

export type InstanceValidationResult<Schema extends JsonSchema> =
  | {
      isValid: false
      details: {
        instance: unknown
        schema: Schema
        failedConstraints: Partial<Schema>
      }
    }
  | {
      isValid: true
      details: null
    }

export const validateInstanceAsLeaf =
  <Schema extends JsonSchemaLeaf>(
    schema: Schema
  ): ((instance: unknown) => InstanceValidationResult<Schema>) =>
  (instance): InstanceValidationResult<Schema> => {
    const validateByType = validate[schema.type]
    const passesValidation = Object.entries(schema).every(([key, value]) =>
      validateByType[key](value)(instance)
    )
    if (passesValidation) return { isValid: true, details: null }
    const failedConstraints: Partial<Schema> = pipe(
      Object.entries(schema),
      filter(([key, value]) => !validateByType[key](value)(instance)),
      Object.fromEntries
    )
    return {
      isValid: false,
      details: {
        instance,
        schema,
        failedConstraints,
      },
    }
  }

export const validateInstanceBy =
  <Schema extends JsonSchema>(
    schema: Schema
  ): ((instance: unknown) => InstanceValidationResult<Schema>) =>
  (instance): InstanceValidationResult<Schema> => {
    if (schema === true) return { isValid: true, details: null }
    if (schema === false) {
      return {
        isValid: schema,
        details: {
          instance,
          schema,
          failedConstraints: schema,
        },
      }
    }
    if (isJsonSchemaLeaf(schema)) {
      const validate = validateInstanceAsLeaf(schema)
      return validate(instance) as InstanceValidationResult<Schema>
    }
    if (isUnionSchema(schema)) {
      const validationResults = schema.anyOf.map((unionMember) =>
        validateInstanceBy(unionMember)(instance)
      )
      const isValid = validationResults.some((result) => result.isValid)
      if (isValid) return { isValid: true, details: null }
      const failedConstraints = validationResults.reduce((acc, result) => ({
        ...acc,
        ...result.details.failedConstraints,
      }))
    }
    return {
      isValid: false,
      details: {
        instance,
        schema,
        failedConstraints: schema,
      },
    }
  }

export const validateWithSchema =
  <Schema extends JsonSchema>(schema: Schema) =>
  (instance: unknown): InstanceValidationResult<Schema> => {
    return
  }
