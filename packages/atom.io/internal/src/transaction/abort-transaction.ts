import { newest } from "../scion"
import type { Store } from "../store"

export const abortTransaction = (store: Store): void => {
	const target = newest(store)
	if (target.transactionMeta === null || target.parent === null) {
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
		target.transactionMeta.update.key,
		`Aborting transaction`,
	)
	target.parent.child = null
}
