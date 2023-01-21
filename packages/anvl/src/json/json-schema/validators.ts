import { isBoolean } from "fp-ts/boolean"
import { isNumber } from "fp-ts/number"
import type { Refinement } from "fp-ts/Refinement"
import { isString } from "fp-ts/string"

import type { integer } from "./integer"
import { isInteger, Int } from "./integer"
import type {
  JsonSchemaMetaTypeName,
  JsonSchemaSystem,
  JsonSchemaTypeName,
} from "./json-schema"
import { isNull } from "../../nullish"
import { isPlainObject } from "../../object"
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

export const JSON_SCHEMA_META_TYPES: JsonSchemaMetaTypes = {
  integer: Int(0),
  number: 0,
  string: ``,
  boolean: false,
  null: null,
  array: [],
  object: {},
  any: null,
  never: undefined as never,
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
    [Feature in keyof Required<JsonSchemaSystem[Name]>]: Feature extends `type`
      ? (v?: Name) => (typeof JSON_SCHEMA_META_REFINERY)[Name]
      : (
          spec: Required<JsonSchemaSystem[Name]>[Feature]
        ) => (value: JsonSchemaMetaTypes[Name]) => boolean
  }
} = {
  integer: {
    type: () => JSON_SCHEMA_META_REFINERY.integer,
    enum: (spec) => (value) => spec.includes(value),
    minimum: (spec) => (value) => value >= spec,
    maximum: (spec) => (value) => value <= spec,
    exclusiveMinimum: (spec) => (value) => value > spec,
    exclusiveMaximum: (spec) => (value) => value < spec,
    multipleOf: (spec) => (value) => value % spec === 0,
  },
  number: {
    type: () => JSON_SCHEMA_META_REFINERY.number,
    enum: (spec) => (value) => spec.includes(value),
    minimum: (spec) => (value) => value >= spec,
    maximum: (spec) => (value) => value <= spec,
    exclusiveMinimum: (spec) => (value) => value > spec,
    exclusiveMaximum: (spec) => (value) => value < spec,
    multipleOf: (spec) => (value) => value % spec === 0,
  },
  string: {
    type: () => JSON_SCHEMA_META_REFINERY.string,
    enum: (spec) => (value) => spec.includes(value),
    minLength: (spec) => (value) => value.length >= spec,
    maxLength: (spec) => (value) => value.length <= spec,
    pattern: (spec) => (value) => new RegExp(spec).test(value),
    format: (spec) => (value) => true,
  },
  boolean: {
    type: () => JSON_SCHEMA_META_REFINERY.boolean,
    enum: (spec) => (value) => spec.includes(value),
  },
  null: {
    type: () => JSON_SCHEMA_META_REFINERY.null,
  },
  array: {
    type: () => JSON_SCHEMA_META_REFINERY.array,
    items: (spec) => (value) => true, // TODO
    minItems: (spec) => (value) => value.length >= spec,
    maxItems: (spec) => (value) => value.length <= spec,
    uniqueItems: (spec) => (value) =>
      spec === false || new Set(value).size === value.length,
  },
  object: {
    type: () => JSON_SCHEMA_META_REFINERY.object,
    properties: (spec) => (value) => true, // TODO
    required: (spec) => (value) => spec.every((key) => key in value),
    propertyNames: (spec) => (value) => true, // TODO
    minProperties: (spec) => (value) => Object.keys(value).length >= spec,
    maxProperties: (spec) => (value) => Object.keys(value).length <= spec,
    additionalProperties: (spec) => (value) => true, // TODO
  },
}
