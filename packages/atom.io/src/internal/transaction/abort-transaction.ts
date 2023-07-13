import type { Store } from ".."

export const abortTransaction = (store: Store): void => {
	if (store.transactionStatus.phase === `idle`) {
		store.config.logger?.warn(
			`abortTransaction called outside of a transaction. This is probably a bug.`,
		)
		return
	}
	store.transactionStatus = { phase: `idle` }
	store.config.logger?.info(`🪂`, `transaction fail`)
}
