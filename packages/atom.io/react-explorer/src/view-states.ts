import type { AtomToken, AtomFamily } from "atom.io"
import { atom, atomFamily } from "atom.io"
import { lazyLocalStorageEffect } from "atom.io/web-effects"
import type { Location } from "react-router-dom"

import { persistStringSetAtom } from "./explorer-effects"

export type View = {
	title: string
	location: Omit<Location, `state`>
}

export const makeViewFamily = (key: string): AtomFamily<View, string> =>
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
		effects: (subKey) => [lazyLocalStorageEffect(`${key}:${subKey}`)],
	})

export const makeViewIndex = (key: string): AtomToken<Set<string>> =>
	atom<Set<string>>({
		key: `${key}:view_index`,
		default: new Set(),
		effects: [persistStringSetAtom(`${key}:view_index`)],
	})

export const makeViewFocusedFamily = (key: string): AtomFamily<number, string> =>
	atomFamily<number, string>({
		key: `${key}:view_focused`,
		default: 0,
		effects: (subKey) => [lazyLocalStorageEffect(`${key}:${subKey}`)],
	})
