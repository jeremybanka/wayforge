import type { Json } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import { raiseError } from "../function"
import { isPlainObject } from "../object"
import { isBoolean, isNumber, isString } from "../primitive"

// export type RefinedJson =
// 	| { type: `array`; data: Json.Array }
// 	| { type: `boolean`; data: boolean }
// 	| { type: `null`; data: null }
// 	| { type: `number`; data: number }
// 	| { type: `object`; data: Json.Object }
// 	| { type: `string`; data: string }

// export const refineJsonType = (data: Json.Serializable): RefinedJson =>
// 	data === null
// 		? { type: `null`, data: null }
// 		: isBoolean(data)
// 			? { type: `boolean`, data }
// 			: isNumber(data)
// 				? { type: `number`, data }
// 				: isString(data)
// 					? { type: `string`, data }
// 					: Array.isArray(data)
// 						? { type: `array`, data }
// 						: isPlainObject(data)
// 							? { type: `object`, data }
// : raiseError(
// 		data === undefined
// 			? `undefined passed to refineJsonType. This is not valid JSON.`
// 			: `${stringifyJson(data)} with prototype "${
// 					Object.getPrototypeOf(data).constructor.name
// 				}" passed to refineJsonType. This is not valid JSON.`,
// 								)
