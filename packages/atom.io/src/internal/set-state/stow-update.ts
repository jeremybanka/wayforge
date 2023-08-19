import type { Store } from ".."
import type { StateUpdate } from "../.."
import type { Atom } from "../atom"

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
	store.transactionStatus.atomUpdates.push({ key, ...update })
	logger?.info(`📝 ${key} stowed (`, update.oldValue, `->`, update.newValue, `)`)
}
