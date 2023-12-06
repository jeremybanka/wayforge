import type { AtomKey, ReadonlySelectorKey, SelectorKey } from "../keys"
import { isStateKey } from "../keys"
import { newest } from "../lineage"
import type { Store } from "../store"

export const getSelectorDependencyKeys = (
	key: string,
	store: Store,
): (
	| AtomKey<unknown>
	| ReadonlySelectorKey<unknown>
	| SelectorKey<unknown>
)[] => {
	const sources = newest(store)
		.selectorGraph.getRelationEntries({ downstreamSelectorKey: key })
		.filter(([_, { source }]) => source !== key)
		.map(([_, { source }]) => source)
		.filter((source) => isStateKey(source, store))
	return sources
}
