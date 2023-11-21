import type { Atom } from "../atom"
import { evictCachedValue } from "../caching"
import { isDone, markDone } from "../operation"
import type { Store } from "../store"
import { IMPLICIT } from "../store"
import { target } from "../transaction"

export const evictDownStream = <T>(
	atom: Atom<T>,
	store: Store = IMPLICIT.STORE,
): void => {
	const core = target(store)
	const downstreamKeys = core.selectorAtoms.getRelatedKeys(atom.key)
	store.logger.info(
		`🧹`,
		atom.type,
		atom.key,
		`evicting ${downstreamKeys?.size ?? 0} states downstream:`,
		downstreamKeys,
	)
	if (downstreamKeys !== undefined) {
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
