export * from "./entries"
export * from "./select-json"
export * from "./select-json-family"

export type primitive = boolean | number | string | null

export namespace Json {
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

export type stringified<J extends Json.Serializable> = string & { __json: J }

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

const JSON_PROTOTYPES = [Array, Boolean, Number, Object, String] as const
export const isJson = (input: unknown): input is Json.Serializable => {
	if (input === null) return true
	if (input === undefined) return false
	const prototype = Object.getPrototypeOf(input)
	return JSON_PROTOTYPES.includes(prototype)
}
