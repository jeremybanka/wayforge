import { isBoolean } from "fp-ts/boolean"
import { pipe } from "fp-ts/function"
import { isNumber } from "fp-ts/number"
import { isString } from "fp-ts/string"

import { isArray } from "../array"
import { select } from "../object"
import { modify } from "../object/modify"
import { doesExtend } from "../object/refinement"
import { couldBe, isWithin } from "../refinement"
import { dereference } from "./dereference"
import { isInteger } from "./integer"
import type {
	ArraySchema,
	BooleanSchema,
	IntegerSchema,
	JsonSchemaRoot,
	MixedSchema,
	NullSchema,
	NumberSchema,
	ObjectSchema,
	StringSchema,
} from "./json-schema"
import {
	JSON_SCHEMA_TYPE_NAMES,
	isArraySchema,
	isBooleanSchema,
	isIntegerSchema,
	isJsonSchemaRoot,
	isMixedSchema,
	isNullSchema,
	isNumberSchema,
	isObjectSchema,
	isStringSchema,
} from "./json-schema"

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
	input: unknown,
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
							// @ts-expect-error need to update refinements to work with optional properties
							return [{ type: `array`, data: result }]
						}
						return [new Error(`Invalid array schema`)]
					}
					case `boolean`: {
						if (isBooleanSchema(result)) {
							// @ts-expect-error need to update refinements to work with optional properties
							return [{ type: `boolean`, data: result }]
						}
						return [new Error(`Invalid boolean schema`)]
					}
					case `integer`: {
						if (isIntegerSchema(result)) {
							// @ts-expect-error need to update refinements to work with optional properties
							return [{ type: `integer`, data: result }]
						}
						return [new Error(`Invalid integer schema`)]
					}
					case `null`: {
						if (isNullSchema(result)) {
							// @ts-expect-error need to update refinements to work with optional properties
							return [{ type: `null`, data: result }]
						}
						return [new Error(`Invalid null schema`)]
					}
					case `number`: {
						if (isNumberSchema(result)) {
							// @ts-expect-error need to update refinements to work with optional properties
							return [{ type: `number`, data: result }]
						}
						return [new Error(`Invalid number schema`)]
					}
					case `object`: {
						if (isObjectSchema(result)) {
							// @ts-expect-error need to update refinements to work with optional properties
							return [{ type: `object`, data: result }]
						}
						return [new Error(`Invalid object schema`)]
					}
					case `string`: {
						if (isStringSchema(result)) {
							// @ts-expect-error need to update refinements to work with optional properties
							return [{ type: `string`, data: result }]
						}
						return [new Error(`Invalid string schema`)]
					}
				}
			}
			if (isMixedSchema(result)) {
				// @ts-expect-error need to update refinements to work with optional properties
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
											`uniqueItems`,
										),
										modify({
											type: `array`,
										} as const),
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
									} as const),
								)
								return { data, type: `boolean` }
							}
							case `integer`: {
								// @ts-expect-error need to update refinements to work with optional properties
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
										`enum`,
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
									} as const),
								)
								return { data, type: `integer` }
							}
							case `null`: {
								// @ts-expect-error need to update refinements to work with optional properties
								const data: JsonSchemaRoot & NullSchema = pipe(
									result,
									select(`$id`, `$schema`, `type`, `enum`),
									modify({
										type: `null`,
									} as const),
								)
								return { data, type: `null` }
							}
							case `number`: {
								// @ts-expect-error need to update refinements to work with optional properties
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
										`enum`,
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
									} as const),
								)
								return { data, type: `number` }
							}
							case `object`: {
								// @ts-expect-error need to update refinements to work with optional properties
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
										`additionalProperties`,
									),
									modify({
										type: `object`,
									} as const),
								)
								return { data, type: `object` }
							}
							case `string`: {
								// @ts-expect-error need to update refinements to work with optional properties
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
										`enum`,
									),
									modify({
										type: `string`,
										enum: (e: MixedSchema[`enum`]) => e?.filter(isString),
									} as const),
								)
								return { data, type: `string` }
							}
						}
					},
				)
				return separated
			}
		}
	}
	return [new Error(`Invalid schema`)]
}
