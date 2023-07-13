import type { Json, JsonArr } from "."

export type JsonInterface<T, J extends Json = Json> = {
	toJson: (t: T) => J
	fromJson: (json: J) => T
}

export const stringSetJsonInterface: JsonInterface<
	Set<string>,
	JsonArr<string>
> = {
	toJson: (stringSet) => Array.from(stringSet),
	fromJson: (json) => new Set(json),
}
