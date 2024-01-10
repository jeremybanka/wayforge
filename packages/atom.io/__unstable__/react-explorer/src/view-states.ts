import type { RegularAtomFamily, RegularAtomToken } from "atom.io"
import { atom, atomFamily } from "atom.io"
import type { Location } from "react-router-dom"
import { lazyLocalStorageEffect } from "~/packages/atom.io/__unstable__/web-effects/src"

import { persistStringSetAtom } from "./explorer-effects"

export type View = {
	title: string
	location: Omit<Location, `state`>
}

export const makeViewFamily = (key: string): RegularAtomFamily<View, string> =>
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

export const makeViewIndex = (key: string): RegularAtomToken<Set<string>> =>
	atom<Set<string>>({
		key: `${key}:view_index`,
		default: new Set(),
		effects: [persistStringSetAtom(`${key}:view_index`)],
	})

export const makeViewFocusedFamily = (
	key: string,
): RegularAtomFamily<number, string> =>
	atomFamily<number, string>({
		key: `${key}:view_focused`,
		default: 0,
		effects: (subKey) => [lazyLocalStorageEffect(`${key}:${subKey}`)],
	})
