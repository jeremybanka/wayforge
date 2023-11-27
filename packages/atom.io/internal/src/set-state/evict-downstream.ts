import type { Atom } from "../atom"
import { evictCachedValue } from "../caching"
import { isDone, markDone } from "../operation"
import type { Store } from "../store"
import { target } from "../transaction"

export const evictDownStream = <T>(atom: Atom<T>, store: Store): void => {
	const core = target(store)
	const downstreamKeys = core.selectorAtoms.getRelatedKeys(atom.key)
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
		if (core.operation.open) {
			store.logger.info(
				`🧹`,
				atom.type,
				atom.key,
				`[ ${[...core.operation.done].join(`, `)} ] already done`,
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
