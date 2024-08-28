import type { Atom } from ".."
import { evictCachedValue } from "../caching"
import { newest } from "../lineage"
import { isDone, markDone } from "../operation"
import type { Store } from "../store"

export const evictDownStream = <T>(atom: Atom<T>, store: Store): void => {
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
			evictCachedValue(key, target)
			markDone(target, key)
		}
	}
}
