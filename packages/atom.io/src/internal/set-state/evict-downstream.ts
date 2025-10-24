import { evictCachedValue } from "../caching"
import type { OpenOperation } from "../operation"
import { isDone, markDone } from "../operation"
import type { Atom } from "../state-types"
import type { Store } from "../store"

export function evictDownstreamFromAtom(
	target: Store & { operation: OpenOperation },
	atom: Atom<any, any>,
): void {
	const { key, type } = atom
	const downstreamKeys = target.selectorAtoms.getRelatedKeys(key)
	target.logger.info(
		`🧹`,
		type,
		key,
		downstreamKeys
			? `evicting ${downstreamKeys.size} states downstream:`
			: `no downstream states`,
		downstreamKeys ?? `to evict`,
	)
	if (downstreamKeys) {
		if (target.operation.open) {
			target.logger.info(
				`🧹`,
				type,
				key,
				`[ ${[...target.operation.done].join(`, `)} ] already done`,
			)
		}
		for (const downstreamKey of downstreamKeys) {
			if (isDone(target, downstreamKey)) {
				continue
			}
			evictCachedValue(target, downstreamKey)
			markDone(target, downstreamKey)
		}
	}
}

export function evictDownstreamFromSelector(
	target: Store & { operation: OpenOperation },
	selectorKey: string,
): void {
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
		evictDownstreamFromSelector(target, downstreamSelectorKey)
	}
}
