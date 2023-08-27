import type { KeyedStateUpdate, StateUpdate } from "atom.io"

import type { Atom } from "../atom"
import type { Store } from "../store"

export const stowUpdate = <T>(
	state: Atom<T>,
	update: StateUpdate<T>,
	store: Store,
): void => {
	const { key } = state
	const { logger } = store.config
	if (store.transactionStatus.phase !== `building`) {
		store.config.logger?.warn(
			`stowUpdate called outside of a transaction. This is probably a bug.`,
		)
		return
	}
	const atomUpdate: KeyedStateUpdate<T> = { key, ...update }
	if (state.family) {
		atomUpdate.family = state.family
	}
	store.transactionStatus.atomUpdates.push(atomUpdate)
	logger?.info(`📝 ${key} stowed (`, update.oldValue, `->`, update.newValue, `)`)
}
