import type { TransactionToken, TransactionUpdateHandler } from "atom.io"

import type { Func, Store } from ".."
import { withdraw } from ".."

export const subscribeToTransaction = <F extends Func>(
	token: TransactionToken<F>,
	handleUpdate: TransactionUpdateHandler<F>,
	key: string,
	store: Store,
): (() => void) => {
	const tx = withdraw(token, store)
	store.logger.info(
		`👀`,
		`transaction`,
		token.key,
		`Adding subscription "${key}"`,
	)
	const unsubscribe = tx.subject.subscribe(key, handleUpdate)
	return () => {
		store.logger.info(
			`🙈`,
			`transaction`,
			token.key,
			`Removing subscription "${key}"`,
		)
		unsubscribe()
	}
}
