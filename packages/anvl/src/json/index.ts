export * from "./json-interface"
import type * as Json from "./json"

export type { Json }

export const parseJson = <S extends stringified<Json.Serializable>>(
	str: S | string,
): S extends stringified<infer J> ? J : Json.Serializable => JSON.parse(str)

export type stringified<J extends Json.Serializable> = string & { __json: J }

export const stringifyJson = <J extends Json.Serializable>(
	json: J,
): stringified<J> => JSON.stringify(json) as stringified<J>

export type Empty = Record<string, never>

export const JSON_TYPE_NAMES = [
	`array`,
	`boolean`,
	`null`,
	`number`,
	`object`,
	`string`,
] as const

export type JsonTypeName = (typeof JSON_TYPE_NAMES)[number]

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
