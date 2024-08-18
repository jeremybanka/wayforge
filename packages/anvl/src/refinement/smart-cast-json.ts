import { jsonRefinery } from "~/packages/atom.io/introspection/src"
import type { Json } from "~/packages/atom.io/json/src"

import * as Cast from "../json/cast-json"

export const castToJson = (
	input: Json.Tree.Any,
): {
	array: Json.Tree.Fork.Arr
	boolean: boolean
	number: number
	object: Json.Tree.Fork.Obj
	string: string
	null: null
} => {
	const refined = jsonRefinery.refine<unknown>(input)
	switch (refined?.type) {
		case `array`: {
			const data = refined.data
			return {
				get array() {
					return data
				},
				get boolean() {
					return Cast.arrayToBoolean(data)
				},
				get number() {
					return Cast.arrayToNumber(data)
				},
				get object() {
					return Cast.arrayToObject(data)
				},
				get string() {
					return Cast.arrayToString(data)
				},
				get null() {
					return null
				},
			}
		}
		case `boolean`: {
			const data = refined.data
			return {
				get array() {
					return Cast.booleanToArray(data)
				},
				get boolean() {
					return data
				},
				get number() {
					return Cast.booleanToNumber(data)
				},
				get object() {
					return Cast.booleanToObject(data)
				},
				get string() {
					return Cast.booleanToString(data)
				},
				get null() {
					return null
				},
			}
		}
		case `number`: {
			const data = refined.data
			return {
				get array() {
					return Cast.numberToArray(data)
				},
				get boolean() {
					return Cast.numberToBoolean(data)
				},
				get number() {
					return data
				},
				get object() {
					return Cast.numberToObject(data)
				},
				get string() {
					return Cast.numberToString(data)
				},
				get null() {
					return null
				},
			}
		}
		case `object`: {
			const data = refined.data
			return {
				get array() {
					return Cast.objectToArray(data)
				},
				get boolean() {
					return Cast.objectToBoolean(data)
				},
				get number() {
					return Cast.objectToNumber(data)
				},
				get object() {
					return data
				},
				get string() {
					return Cast.objectToString(data)
				},
				get null() {
					return null
				},
			}
		}
		case `string`: {
			const data = refined.data
			return {
				get array() {
					return Cast.stringToArray(data)
				},
				get boolean() {
					return Cast.stringToBoolean(data)
				},
				get number() {
					return Cast.stringToNumber(data)
				},
				get object() {
					return Cast.stringToObject(data)
				},
				get string() {
					return data
				},
				get null() {
					return null
				},
			}
		}
		case `null`: {
			const data = refined.data
			return {
				get array() {
					return Cast.nullToArray()
				},
				get boolean() {
					return Cast.nullToBoolean()
				},
				get number() {
					return Cast.nullToNumber()
				},
				get object() {
					return Cast.nullToObject()
				},
				get string() {
					return Cast.nullToString()
				},
				get null() {
					return null
				},
			}
		}
		default:
			console.error(`Could not handle input given to castToJson`)
			throw new Error(`Could not handle input given to castToJson`)
	}
}
