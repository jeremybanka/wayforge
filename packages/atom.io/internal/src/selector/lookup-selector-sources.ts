import type { AtomToken, ReadonlySelectorToken, SelectorToken } from "atom.io"

import type { Store } from "../store"
import { lookup } from "../store"
import { target } from "../transaction"

export const lookupSelectorSources = (
	key: string,
	store: Store,
): (
	| AtomToken<unknown>
	| ReadonlySelectorToken<unknown>
	| SelectorToken<unknown>
)[] => {
	const sources = target(store)
		.selectorGraph.getRelationEntries({ downstreamSelectorKey: key })
		.filter(([_, { source }]) => source !== key)
		.map(([_, { source }]) => lookup(source, store))
	return sources
}
