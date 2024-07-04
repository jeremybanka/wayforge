import type { RegularAtomFamilyToken, RegularAtomToken } from "atom.io"
import { atom, atomFamily } from "atom.io"
import { createJsonLocalStorageEffect } from "atom.io/browser"
import type { Location } from "react-router-dom"

import { persistStringSetAtom } from "./explorer-effects"

export type View = {
	title: string
	location: Omit<Location, `state`>
}

export const makeViewFamily = (
	key: string,
): RegularAtomFamilyToken<View, string> =>
	atomFamily<View, string>({
		key: `${key}:view`,
		default: {
			title: ``,
			location: {
				pathname: ``,
				search: ``,
				hash: ``,
				key: ``,
			},
		},
		effects: (subKey) => [createJsonLocalStorageEffect(`${key}:${subKey}`)],
	})

export const makeViewIndex = (key: string): RegularAtomToken<Set<string>> =>
	atom<Set<string>>({
		key: `${key}:view_index`,
		default: new Set(),
		effects: [persistStringSetAtom(`${key}:view_index`)],
	})

export const makeViewFocusedFamily = (
	key: string,
): RegularAtomFamilyToken<number, string> =>
	atomFamily<number, string>({
		key: `${key}:view_focused`,
		default: 0,
		effects: (subKey) => [createJsonLocalStorageEffect(`${key}:${subKey}`)],
	})
