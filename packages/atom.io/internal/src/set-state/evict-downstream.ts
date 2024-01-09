import type { Atom } from ".."
import { evictCachedValue } from "../caching"
import { isDone, markDone } from "../operation"
import type { Store } from "../store"

export const evictDownStream = <T>(atom: Atom<T>, store: Store): void => {
	const downstreamKeys = store.selectorAtoms.getRelatedKeys(atom.key)
	store.logger.info(
		`🧹`,
		atom.type,
		atom.key,
		downstreamKeys
			? `evicting ${downstreamKeys.size} states downstream:`
			: `no downstream states`,
		downstreamKeys ?? `to evict`,
	)
	if (downstreamKeys) {
		if (store.operation.open) {
			store.logger.info(
				`🧹`,
				atom.type,
				atom.key,
				`[ ${[...store.operation.done].join(`, `)} ] already done`,
			)
		}
		for (const key of downstreamKeys) {
			if (isDone(key, store)) {
				continue
			}
			evictCachedValue(key, store)
			markDone(key, store)
		}
	}
}
