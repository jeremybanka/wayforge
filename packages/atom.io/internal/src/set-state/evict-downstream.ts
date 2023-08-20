import type { Atom } from "../atom"
import { isDone, markDone } from "../operation"
import type { Store } from "../store"
import { IMPLICIT } from "../store"
import { target } from "../transaction"

export const evictDownStream = <T>(
	state: Atom<T>,
	store: Store = IMPLICIT.STORE,
): void => {
	const core = target(store)
	const downstream = core.selectorAtoms.getRelations(state.key)
	const downstreamKeys = downstream.map(({ id }) => id)
	store.config.logger?.info(
		`   || ${downstreamKeys.length} downstream:`,
		downstreamKeys,
	)
	if (core.operation.open) {
		store.config.logger?.info(`   ||`, [...core.operation.done], `already done`)
	}
	downstream.forEach(({ id: stateKey }) => {
		if (isDone(stateKey, store)) {
			store.config.logger?.info(`   || ${stateKey} already done`)
			return
		}
		const state =
			core.selectors.get(stateKey) ?? core.readonlySelectors.get(stateKey)
		if (!state) {
			store.config.logger?.info(
				`   || ${stateKey} is an atom, and can't be downstream`,
			)
			return
		}
		core.valueMap.delete(stateKey)
		store.config.logger?.info(`   xx evicted "${stateKey}"`)

		markDone(stateKey, store)
	})
}
