import { evictCachedValue } from "../caching"
import { newest } from "../lineage"
import { isDone, markDone } from "../operation"
import type { Store } from "../store"

export function evictDownstreamFromAtom(
	store: Store,
	atomKey: string,
	atomType: `atom` | `mutable_atom`,
): void {
	const target = newest(store)
	const downstreamKeys = target.selectorAtoms.getRelatedKeys(atomKey)
	target.logger.info(
		`🧹`,
		atomType,
		atomKey,
		downstreamKeys
			? `evicting ${downstreamKeys.size} states downstream:`
			: `no downstream states`,
		downstreamKeys ?? `to evict`,
	)
	if (downstreamKeys) {
		if (target.operation.open) {
			target.logger.info(
				`🧹`,
				atomType,
				atomKey,
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

export function evictDownstreamFromSelector(
	store: Store,
	selectorKey: string,
): void {
	const target = newest(store)
	const relationEntries = target.selectorGraph
		.getRelationEntries({
			upstreamSelectorKey: selectorKey,
		})
		.filter(([_, { source }]) => source === selectorKey)
	for (const [downstreamSelectorKey] of relationEntries) {
		if (isDone(target, downstreamSelectorKey)) {
			continue
		}
		evictCachedValue(target, downstreamSelectorKey)
		markDone(target, downstreamSelectorKey)
		evictDownstreamFromSelector(store, downstreamSelectorKey)
	}
}
