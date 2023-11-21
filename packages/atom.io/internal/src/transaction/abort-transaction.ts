import type { Store } from "../store"

export const abortTransaction = (store: Store): void => {
	if (store.transactionStatus.phase === `idle`) {
		store.logger.warn(
			`🐞`,
			`transaction`,
			`???`,
			`abortTransaction called outside of a transaction. This is probably a bug in AtomIO.`,
		)
		return
	}
	store.logger.info(
		`🪂`,
		`transaction`,
		store.transactionStatus.key,
		`Aborting transaction`,
	)
	store.transactionStatus = { phase: `idle` }
}
