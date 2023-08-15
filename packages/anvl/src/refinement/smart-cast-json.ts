import { refineJsonType } from "./refine-json"
import type { Json } from "../json"
import * as Cast from "../json/cast-json"

export const castToJson = (
	input: Json.Serializable,
): {
	to: {
		array: () => Json.Array
		boolean: () => boolean
		number: () => number
		object: () => Json.Object
		string: () => string
		null: () => null
	}
} => {
	const json = refineJsonType(input)
	return {
		to: {
			array: () => {
				switch (json.type) {
					case `array`:
						return json.data
					case `object`:
						return Cast.objectToArray(json.data)
					case `string`:
						return Cast.stringToArray(json.data)
					case `boolean`:
						return Cast.booleanToArray(json.data)
					case `number`:
						return Cast.numberToArray(json.data)
					case `null`:
						return Cast.nullToArray()
				}
			},
			boolean: () => {
				switch (json.type) {
					case `array`:
						return Cast.arrayToBoolean(json.data)
					case `object`:
						return Cast.objectToBoolean(json.data)
					case `string`:
						return Cast.stringToBoolean(json.data)
					case `boolean`:
						return json.data
					case `number`:
						return Cast.numberToBoolean(json.data)
					case `null`:
						return Cast.nullToBoolean()
				}
			},
			number: () => {
				switch (json.type) {
					case `array`:
						return Cast.arrayToNumber(json.data)
					case `object`:
						return Cast.objectToNumber(json.data)
					case `string`:
						return Cast.stringToNumber(json.data)
					case `boolean`:
						return Cast.booleanToNumber(json.data)
					case `number`:
						return json.data
					case `null`:
						return Cast.nullToNumber()
				}
			},
			object: () => {
				switch (json.type) {
					case `array`:
						return Cast.arrayToObject(json.data)
					case `object`:
						return json.data
					case `string`:
						return Cast.stringToObject(json.data)
					case `boolean`:
						return Cast.booleanToObject(json.data)
					case `number`:
						return Cast.numberToObject(json.data)
					case `null`:
						return Cast.nullToObject()
				}
			},
			string: () => {
				switch (json.type) {
					case `array`:
						return Cast.arrayToString(json.data)
					case `object`:
						return Cast.objectToString(json.data)
					case `string`:
						return json.data
					case `boolean`:
						return Cast.booleanToString(json.data)
					case `number`:
						return Cast.numberToString(json.data)
					case `null`:
						return Cast.nullToString()
				}
			},
			null: () => null,
		},
	}
}
