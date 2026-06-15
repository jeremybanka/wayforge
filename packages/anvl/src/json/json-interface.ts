import type { Json, JsonInterface } from "atom.io/foundations/json"

export const stringSetJsonInterface: JsonInterface<
	Set<string>,
	Json.Array<string>
> = {
	toJson: (stringSet) => Array.from(stringSet),
	fromJson: (json) => new Set(json),
}
