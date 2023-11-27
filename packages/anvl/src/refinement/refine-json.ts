import { attempt, raiseError } from "../function"
import { stringifyJson } from "../json"
import type { Json } from "../json"
import { isPlainObject } from "../object"
import { isBoolean, isNumber, isString } from "../primitive"

const JSON_PROTOTYPES = [
	`Array`,
	`Boolean`,
	`Number`,
	`Object`,
	`String`,
] as const

export type RefinedJson =
	| { type: `array`; data: Json.Array }
	| { type: `boolean`; data: boolean }
	| { type: `null`; data: null }
	| { type: `number`; data: number }
	| { type: `object`; data: Json.Object }
	| { type: `string`; data: string }

export const refineJsonType = (data: Json.Serializable): RefinedJson =>
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
export const isJson = (input: unknown): input is Json.Serializable => {
	if (input === null) return true
	if (input === undefined) return false
	const prototype = Object.getPrototypeOf(input)?.constructor.name
	const isJson = JSON_PROTOTYPES.includes(prototype)
	return isJson
}

export const isPlainJson = (input: unknown): input is Json.Serializable =>
	attempt(() => isJson(input) && refineJsonType(input))
