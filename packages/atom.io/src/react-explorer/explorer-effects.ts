import { isString } from "fp-ts/lib/string"

import { isArray } from "~/packages/anvl/src/array"
import { parseJson, stringifyJson } from "~/packages/anvl/src/json"

import { persistAtom } from "../web-effects"

export const persistStringSetAtom = persistAtom<Set<string>>(localStorage)({
	stringify: (set) => stringifyJson([...set]),
	parse: (string) => {
		try {
			const json = parseJson(string)
			const array = isArray(isString)(json) ? json : []
			return new Set(array)
		} catch (thrown) {
			console.error(`Error parsing spaceIndexState from localStorage`)
			return new Set()
		}
	},
})
