import { isBoolean } from "fp-ts/boolean"
import { isNumber } from "fp-ts/number"
import { isString } from "fp-ts/string"

import { isPlainObject } from "~/packages/anvl/src/object/refinement"

import { stringifyJson } from "."
import type { JsonArr, JsonObj, Json } from "."
import { attempt, raiseError } from "../function"

const JSON_PROTOTYPES = [
	`Array`,
	`Boolean`,
	`Number`,
	`Object`,
	`String`,
] as const

export type RefinedJson =
	| { type: `array`; data: JsonArr }
	| { type: `boolean`; data: boolean }
	| { type: `null`; data: null }
	| { type: `number`; data: number }
	| { type: `object`; data: JsonObj }
	| { type: `string`; data: string }

export const refineJsonType = (data: Json): RefinedJson =>
	data === null
		? { type: `null`, data: null }
		: isBoolean(data)
		? { type: `boolean`, data }
		: isNumber(data)
		? { type: `number`, data }
		: isString(data)
		? { type: `string`, data }
		: Array.isArray(data)
		? { type: `array`, data }
		: isPlainObject(data)
		? { type: `object`, data }
		: raiseError(
				data === undefined
					? `undefined passed to refineJsonType. This is not valid JSON.`
					: `${stringifyJson(data)} with prototype "${
							Object.getPrototypeOf(data).constructor.name
					  }" passed to refineJsonType. This is not valid JSON.`,
		  )
export const isJson = (input: unknown): input is Json => {
	if (input === null) return true
	if (input === undefined) return false
	const prototype = Object.getPrototypeOf(input)?.constructor.name
	const isJson = JSON_PROTOTYPES.includes(prototype)
	return isJson
}

export const isPlainJson = (input: unknown): input is Json =>
	attempt(() => isJson(input) && refineJsonType(input))
