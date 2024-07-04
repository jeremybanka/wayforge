export * from "./select-json"
export * from "./select-json-family"
import type * as Json from "./json"
export * from "./primitive"

export type { Json }

export type JsonInterface<T, J extends Json.Serializable = Json.Serializable> = {
	toJson: (t: T) => J
	fromJson: (json: J) => T
}

export type JsonIO = (...params: Json.Serializable[]) => Json.Serializable | void

export const parseJson = <S extends Stringified<Json.Serializable>>(
	str: S | string,
): S extends Stringified<infer J> ? J : Json.Serializable => JSON.parse(str)

export type Stringified<J extends Json.Serializable> = string & { __J: J }

export const stringifyJson = <J extends Json.Serializable>(
	json: J,
): Stringified<J> => JSON.stringify(json) as Stringified<J>
