export * from "./entries"
export * from "./select-json"
export * from "./select-json-family"

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

export type stringified<J extends Json.Serializable> = J extends string
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
						: string & { __json?: J }

export const parseJson = <S extends stringified<Json.Serializable>>(
	str: S | string,
): S extends stringified<infer J> ? J : Json.Serializable => JSON.parse(str)

export const stringifyJson = <J extends Json.Serializable>(
	json: J,
): stringified<J> => JSON.stringify(json) as stringified<J>

export type Canonical = primitive | ReadonlyArray<Canonical>

export type JsonIO = (...params: Json.Serializable[]) => Json.Serializable | void

export type JsonInterface<T, J extends Json.Serializable = Json.Serializable> = {
	toJson: (t: T) => J
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
