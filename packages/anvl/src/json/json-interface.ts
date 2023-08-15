import type { Json } from "."

export type JsonInterface<T, J extends Json.Serializable = Json.Serializable> = {
	toJson: (t: T) => J
	fromJson: (json: J) => T
}

export const stringSetJsonInterface: JsonInterface<
	Set<string>,
	Json.Array<string>
> = {
	toJson: (stringSet) => Array.from(stringSet),
	fromJson: (json) => new Set(json),
}
