import { isBoolean } from "fp-ts/boolean"
import { isNumber } from "fp-ts/number"
import type { Refinement } from "fp-ts/Refinement"
import { isString } from "fp-ts/string"

import type { integer } from "./integer"
import { isInteger } from "./integer"
import type { JsonSchemaRef } from "./refs"
import { isJsonSchemaRef } from "./refs"
import type { JsonSchemaStringFormat } from "./string-formats"
import { JSON_SCHEMA_STRING_FORMATS } from "./string-formats"
import { isArray } from "../array"
import { JSON_TYPE_NAMES } from "../json"
import { ifDefined } from "../nullish"
import { doesExtend, isRecord } from "../object/refinement"
import {
	isLiteral,
	isWithin,
	couldBe,
	isIntersection,
	isUnion,
} from "../refinement"
import type { Refined } from "../refinement/refined"

/* eslint-disable max-lines */

export const JSON_SCHEMA_TYPE_NAMES = [...JSON_TYPE_NAMES, `integer`] as const
export type JsonSchemaTypeName = typeof JSON_SCHEMA_TYPE_NAMES[number]

export const JSON_SCHEMA_META_TYPE_NAMES = [
	...JSON_SCHEMA_TYPE_NAMES,
	`any`,
	`never`,
] as const
export type JsonSchemaMetaTypeName = typeof JSON_SCHEMA_META_TYPE_NAMES[number]

export const JSON_SCHEMA_LOGIC_MODES = [
	`union`,
	`exclusive`,
	`intersection`,
	`negation`,
	`conditional`,
] as const
export type JsonSchemaLogicMode = typeof JSON_SCHEMA_LOGIC_MODES[number]

export interface JsonSchemaSystem
	extends Record<JsonSchemaLogicMode & JsonSchemaMetaTypeName, any> {
	array: ArraySchema
	boolean: BooleanSchema
	integer: IntegerSchema
	null: NullSchema
	number: NumberSchema
	object: ObjectSchema
	string: StringSchema
	any: true
	never: false
	union: UnionSchema
	exclusive: ExclusiveSchema
	intersection: IntersectionSchema
	negation: NegationSchema
	conditional: ConditionalSchema
}

// export const JSON_SCHEMA_SYSTEM: JsonSchemaSystem = {
//   array: { type: `array` },
//   boolean: { type: `boolean` },
//   integer: { type: `integer` },
//   null: { type: `null` },
//   number: { type: `number` },
//   object: { type: `object` },
//   string: { type: `string` },
//   any: true,
//   never: false,
//   union: { anyOf: [true] },
//   exclusive: { oneOf: [true] },
//   intersection: { allOf: [true] },
//   negation: { not: false },
//   conditional: { if: true, then: true, else: false },
// } as const

export const JSON_SCHEMA_REFINERY: {
	[K in JsonSchemaLogicMode & JsonSchemaMetaTypeName]: Refinement<
		unknown,
		JsonSchemaSystem[K]
	>
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
	union: isUnionSchema,
	intersection: isIntersectionSchema,
	negation: isNegationSchema,
	conditional: isConditionalSchema,
}

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
	patternProperties?: Record<string, JsonSchema>
	required?: string[]
	additionalProperties?: JsonSchema
	propertyNames?: JsonSchema
	minProperties?: integer
	maxProperties?: integer
	dependentSchemas?: Record<string, JsonSchema>
}
export const objectSchemaStructure = {
	type: isLiteral(`object`),
	properties: ifDefined(isRecord(isString, isJsonSchema)),
	required: ifDefined(isArray(isString)),
	additionalProperties: ifDefined(isJsonSchema),
	propertyNames: ifDefined(isStringSchema),
	minProperties: ifDefined(isInteger),
	maxProperties: ifDefined(isInteger),
	dependentSchemas: ifDefined(isRecord(isString, isJsonSchema)),
}
export function isObjectSchema(input: unknown): input is ObjectSchema {
	return doesExtend(objectSchemaStructure)(input)
}

export type ArraySchema = {
	type: `array`
	items?: JsonSchema | JsonSchema[]
	minItems?: integer
	maxItems?: integer
	uniqueItems?: boolean
}
export const arraySchemaStructure = {
	type: isLiteral(`array`),
	items: ifDefined(couldBe(isJsonSchema).or(isArray(isJsonSchema))),
	minItems: ifDefined(isInteger),
	maxItems: ifDefined(isInteger),
	uniqueItems: ifDefined(isBoolean),
}
export function isArraySchema(input: unknown): input is ArraySchema {
	return doesExtend(arraySchemaStructure)(input)
}

export type UnionSchema = { anyOf: JsonSchema[] }
export const unionSchemaStructure = { anyOf: isArray(isJsonSchema) }
export function isUnionSchema(input: unknown): input is UnionSchema {
	return doesExtend(unionSchemaStructure)(input)
}
export type IntersectionSchema = {
	allOf: JsonSchema[] | ReadonlyArray<JsonSchema>
}
export type ExclusiveSchema = {
	oneOf: JsonSchema[] | ReadonlyArray<JsonSchema>
}
export const exclusiveSchemaStructure = { oneOf: isArray(isJsonSchema) }
export function isExclusiveSchema(input: unknown): input is ExclusiveSchema {
	return doesExtend(exclusiveSchemaStructure)(input)
}

export const intersectionSchemaStructure = { allOf: isArray(isJsonSchema) }
export function isIntersectionSchema(
	input: unknown,
): input is IntersectionSchema {
	return doesExtend(intersectionSchemaStructure)(input)
}

export type ConditionalSchema = {
	if: JsonSchema
	then?: JsonSchema
	else?: JsonSchema
}
export const conditionalSchemaStructure = {
	if: isJsonSchema,
	then: ifDefined(isJsonSchema),
	else: ifDefined(isJsonSchema),
}
export function isConditionalSchema(input: unknown): input is ConditionalSchema {
	return doesExtend(conditionalSchemaStructure)(input)
}

export type NegationSchema = { not: JsonSchema }
export const negationSchemaStructure = { not: isJsonSchema }
export function isNegationSchema(input: unknown): input is NegationSchema {
	return doesExtend(negationSchemaStructure)(input)
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
	...arraySchemaStructure,
	...booleanSchemaStructure,
	...integerSchemaStructure,
	...nullSchemaStructure,
	...numberSchemaStructure,
	...objectSchemaStructure,
	...stringSchemaStructure,
	type: isArray(isWithin(JSON_SCHEMA_TYPE_NAMES)),
	enum: ifDefined(
		isArray(isUnion.or(isInteger).or(isBoolean).or(isNumber).or(isString)),
	),
}
export function isMixedSchema(input: unknown): input is MixedSchema {
	return doesExtend(mixedSchemaStructure)(input)
}

export type JsonSchemaCore =
	| ArraySchema
	| BooleanSchema
	| ConditionalSchema
	| ExclusiveSchema
	| IntegerSchema
	| IntersectionSchema
	| MixedSchema
	| NegationSchema
	| NullSchema
	| NumberSchema
	| ObjectSchema
	| StringSchema
	| UnionSchema

export const isJsonSchemaCore = isUnion
	.or(isArraySchema)
	.or(isBooleanSchema)
	.or(isConditionalSchema)
	.or(isExclusiveSchema)
	.or(isIntegerSchema)
	.or(isIntersectionSchema)
	.or(isMixedSchema)
	.or(isNegationSchema)
	.or(isNullSchema)
	.or(isNumberSchema)
	.or(isObjectSchema)
	.or(isStringSchema)
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
	| ConditionalSchema
	| ExclusiveSchema
	| IntersectionSchema
	| MixedSchema
	| NegationSchema
	| ObjectSchema
	| UnionSchema
export function isJsonSchemaTree(input: unknown): input is JsonSchemaTree {
	return isUnion
		.or(isArraySchema)
		.or(isMixedSchema)
		.or(isObjectSchema)
		.or(isUnionSchema)
		.or(isIntersectionSchema)
		.or(isExclusiveSchema)
		.or(isConditionalSchema)
		.or(isNegationSchema)(input)
}

export type JsonSchemaRoot = {
	$id?: string
	$schema?: string
	$defs?: Record<string, JsonSchema>
	definitions?: Record<string, JsonSchema>
}

export const isJsonSchemaRoot = doesExtend({
	$id: ifDefined(isString),
	$schema: ifDefined(isString),
})

/* prettier-ignore */
export type JsonSchemaObject = JsonSchemaCore & JsonSchemaRoot
export const isJsonSchemaObject = isIntersection
	.and(isJsonSchemaCore)
	.and(isJsonSchemaRoot)

export type JsonSchema = JsonSchemaObject | JsonSchemaRef | boolean
export function isJsonSchema(input: unknown): input is JsonSchema {
	return couldBe(isJsonSchemaObject).or(isBoolean).or(isJsonSchemaRef)(input)
}
