import type { Atom, Selector } from ".."
import { evictCachedValue } from "../caching"
import { newest } from "../lineage"
import { isDone, markDone } from "../operation"
import type { Store } from "../store"

export function evictDownStream(store: Store, atom: Atom<any>): void {
	const target = newest(store)
	const downstreamKeys = target.selectorAtoms.getRelatedKeys(atom.key)
	target.logger.info(
		`🧹`,
		atom.type,
		atom.key,
		downstreamKeys
			? `evicting ${downstreamKeys.size} states downstream:`
			: `no downstream states`,
		downstreamKeys ?? `to evict`,
	)
	if (downstreamKeys) {
		if (target.operation.open) {
			target.logger.info(
				`🧹`,
				atom.type,
				atom.key,
				`[ ${[...target.operation.done].join(`, `)} ] already done`,
			)
		}
		for (const key of downstreamKeys) {
			if (isDone(target, key)) {
				continue
			}
			evictCachedValue(target, key)
			markDone(target, key)
		}
	}
}

export function evictDownStreamFromSelector(
	store: Store,
	selector: Selector<any>,
): void {
	const target = newest(store)
	const relationEntries = target.selectorGraph
		.getRelationEntries({
			upstreamSelectorKey: selector.key,
		})
		.filter(([_, { source }]) => source === selector.key)
	for (const [downstreamSelectorKey] of relationEntries) {
		if (isDone(target, downstreamSelectorKey)) {
			continue
		}
		evictCachedValue(target, downstreamSelectorKey)
		markDone(target, downstreamSelectorKey)
	}
}
