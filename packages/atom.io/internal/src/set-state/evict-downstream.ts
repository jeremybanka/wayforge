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
	store.config.logger?.info(
		`   || ${downstreamKeys?.size ?? `none`} downstream:`,
		downstreamKeys,
	)
	if (core.operation.open) {
		store.config.logger?.info(`   ||`, [...core.operation.done], `already done`)
	}
	if (downstreamKeys) {
		for (const key of downstreamKeys) {
			if (isDone(key, store)) {
				store.config.logger?.info(`   || ${key} already done`)
				continue
			}
			const state = core.selectors.get(key) ?? core.readonlySelectors.get(key)
			if (!state) {
				store.config.logger?.info(
					`   || ${key} was not found in selectors or readonlySelectors`,
				)
				return
			}
			evictCachedValue(key, store)
			markDone(key, store)
		}
	}
}
