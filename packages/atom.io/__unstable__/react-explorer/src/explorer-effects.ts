import { persistAtomToBrowserStorage } from "atom.io/browser"
import { parseJson, stringifyJson } from "atom.io/json"

import { isArray } from "~/packages/anvl/src/array"

export const persistStringSetAtom = persistAtomToBrowserStorage<Set<string>>(
	localStorage,
	{
		stringify: (set) => stringifyJson([...set]),
		parse: (string) => {
			try {
				const json = parseJson(string)
				const array = isArray((v): v is string => typeof v === `string`)(json)
					? json
					: []
				return new Set(array)
			} catch (thrown) {
				console.error(`Error parsing spaceIndexState from localStorage`)
				return new Set()
			}
		},
	},
)
