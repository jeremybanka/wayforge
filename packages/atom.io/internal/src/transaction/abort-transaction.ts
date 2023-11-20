import type { Store } from "../store"

export const abortTransaction = (store: Store): void => {
	if (store.transactionStatus.phase === `idle`) {
		store.logger.warn(
			`🐞 abortTransaction called outside of a transaction. This is probably a bug.`,
		)
		return
	}
	store.logger.info(
		`🪂`,
		`Aborting transaction "${store.transactionStatus.key}"`,
	)
	store.transactionStatus = { phase: `idle` }
}
