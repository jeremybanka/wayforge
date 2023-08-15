export * from "./json-interface"
import type * as Json from "./json"
export { Json }

export const parseJson = <S extends Stringified<Json.Serializable>>(
	str: S | string,
): S extends Stringified<infer J> ? J : Json.Serializable => JSON.parse(str)

export type Stringified<J extends Json.Serializable> = string & { __json: J }

export const stringifyJson = <J extends Json.Serializable>(
	json: J,
): Stringified<J> => JSON.stringify(json) as Stringified<J>

export type Empty = Record<string, never>

export const JSON_TYPE_NAMES = [
	`array`,
	`boolean`,
	`null`,
	`number`,
	`object`,
	`string`,
] as const

export type JsonTypeName = typeof JSON_TYPE_NAMES[number]

export interface JsonTypes extends Record<JsonTypeName, Json.Serializable> {
	array: Json.Array
	boolean: boolean
	null: null
	number: number
	object: Json.Object
	string: string
}

export const JSON_DEFAULTS: JsonTypes = {
	array: [],
	boolean: false,
	null: null,
	number: 0,
	object: {},
	string: ``,
}
