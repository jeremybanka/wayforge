import type { AtomKey, ReadonlySelectorKey, SelectorKey } from "../keys"
import { isStateKey } from "../keys"
import { newest } from "../lineage"
import type { Store } from "../store"

export const getSelectorDependencyKeys = (
	store: Store,
	key: string,
): (
	| AtomKey<unknown>
	| ReadonlySelectorKey<unknown>
	| SelectorKey<unknown>
)[] => {
	const sources = newest(store)
		.selectorGraph.getRelationEntries({ downstreamSelectorKey: key })
		.filter(([_, { source }]) => source !== key)
		.map(([_, { source }]) => source)
		.filter((source) => isStateKey(store, source))
	return sources
}
