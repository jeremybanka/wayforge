import { newest } from "../lineage"
import type { Store } from "../store"
import { isChildStore } from "./is-root-store"

export const abortTransaction = (store: Store): void => {
	const target = newest(store)
	if (!isChildStore(target)) {
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
		target.transactionMeta.update.token.key,
		`Aborting transaction`,
	)
	target.parent.child = null
}
