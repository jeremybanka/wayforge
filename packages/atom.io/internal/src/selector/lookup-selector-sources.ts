import type {
	AtomToken,
	ReadonlySelectorToken,
	SelectorToken,
	Store,
} from "atom.io"

import { lookup } from "../store"
import { target } from "../transaction"

export const lookupSelectorSources = (
	key: string,
	store: Store,
): (
	| AtomToken<unknown>
	| ReadonlySelectorToken<unknown>
	| SelectorToken<unknown>
)[] =>
	target(store)
		.selectorGraph.getRelations(key)
		.filter(({ source }) => source !== key)
		.map(({ source }) => lookup(source, store))
