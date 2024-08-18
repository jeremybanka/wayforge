import type { Json } from "atom.io/json"

export * from "./json-interface"

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
