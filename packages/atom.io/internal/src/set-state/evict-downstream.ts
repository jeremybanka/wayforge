import type { Atom } from "../atom"
import { evictCachedValue } from "../caching"
import { isDone, markDone } from "../operation"
import type { Store } from "../store"
import { IMPLICIT } from "../store"
import { target } from "../transaction"

export const evictDownStream = <T>(
	state: Atom<T>,
	store: Store = IMPLICIT.STORE,
): void => {
	const core = target(store)
	const downstreamKeys = core.selectorAtoms.getRelatedKeys(state.key)
	store.logger.info(
		`🧹 evicting ${downstreamKeys?.size} states downstream from ${state.type} "${state.key}":`,
		downstreamKeys,
	)
	if (core.operation.open) {
		store.logger.info(`🧹`, [...core.operation.done], `already done`)
	}
	if (downstreamKeys) {
		for (const key of downstreamKeys) {
			if (isDone(key, store)) {
				continue
			}
			const state = core.selectors.get(key) ?? core.readonlySelectors.get(key)
			if (!state) {
				store.logger.error(
					`🐞 "${key}" was not found in selectors or readonlySelectors`,
				)
				return
			}
			evictCachedValue(key, store)
			markDone(key, store)
		}
	}
}
