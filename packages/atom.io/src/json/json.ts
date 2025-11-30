import type { ViewOf } from "atom.io"

export type primitive = boolean | number | string | null

export namespace Json {
	export namespace Tree {
		// eslint-disable-next-line @typescript-eslint/no-shadow
		export type Array<Element = unknown> = ReadonlyArray<Element>
		// eslint-disable-next-line @typescript-eslint/no-shadow
		export type Object<K extends string = string, V = unknown> = Record<K, V>
		export type Fork = Array | Object
		export type Leaf = primitive
		export type Node = Fork | Leaf
	}

	/** A value can survive being {@link JSON.stringify}-ed and {@link JSON.parse}-d fully intact */
	export type Serializable =
		| primitive
		| Readonly<{ [key: string]: Serializable }>
		| ReadonlyArray<Serializable>

	export type Object<
		Key extends string = string,
		Value extends Serializable = Serializable,
	> = Record<Key, Value>

	export type Array<Element extends Serializable = Serializable> =
		ReadonlyArray<Element>
}

/** A generic that retains the type information of a {@link Json.Serializable} value while in string form */
// biome-ignore format: long silly ternary
export type stringified<J extends Json.Serializable> = (
      J extends string
    ? `"${J}"`
    : J extends number
    ? `${J}`
    : J extends true
    ? `true`
    : J extends false
    ? `false`
    : J extends boolean
    ? `false` | `true`
    : J extends null
    ? `null`
    : J extends []
    ? `[]`
    : J extends [infer Element extends Json.Serializable]
    ? `[${stringified<Element>}]`
    : J extends [
					infer Element1 extends Json.Serializable,
					infer Element2 extends Json.Serializable,
				]
    ? `[${stringified<Element1>}, ${stringified<Element2>}]`
    : J extends [
					infer Element1 extends Json.Serializable,
					infer Element2 extends Json.Serializable,
					infer Element3 extends Json.Serializable,
				]
    ? `[${stringified<Element1>}, ${stringified<Element2>}, ${stringified<Element3>}]`
    : J extends any[]
    ? `[${string}]` & { __json?: J }
    : string & { __json?: J }
  )

/** Type-safe wrapper for {@link JSON.parse} */
export function parseJson<J extends Json.Serializable>(str: stringified<J>): J
/** Type-safe wrapper for {@link JSON.parse} */
export function parseJson(str: string): Json.Serializable
export function parseJson(str: string): Json.Serializable {
	return JSON.parse(str)
}

/** Type-safe wrapper for {@link JSON.stringify} */
export const stringifyJson = <J extends Json.Serializable>(
	json: J,
): stringified<J> => JSON.stringify(json) as stringified<J>

/** A function whose parameters and return value are {@link Json.Serializable} */
export type JsonIO = (...params: Json.Serializable[]) => Json.Serializable | void

export type JsonInterface<T, J extends Json.Serializable = Json.Serializable> = {
	toJson: (t: ViewOf<T>) => J
	fromJson: (json: J) => T
}

const JSON_PROTOTYPES = [
	Array.prototype,
	Boolean.prototype,
	Number.prototype,
	Object.prototype,
	String.prototype,
] as const
export const isJson = (input: unknown): input is Json.Tree.Node => {
	if (input === null) return true
	if (input === undefined) return false
	const prototype = Object.getPrototypeOf(input)
	return JSON_PROTOTYPES.includes(prototype)
}

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
