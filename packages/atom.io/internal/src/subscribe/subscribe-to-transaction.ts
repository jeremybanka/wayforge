import type { TransactionToken, TransactionUpdateHandler } from "atom.io"

import type { Func, Store } from ".."
import { withdraw } from ".."

export const subscribeToTransaction = <F extends Func>(
	store: Store,
	token: TransactionToken<F>,
	key: string,
	handleUpdate: TransactionUpdateHandler<F>,
): (() => void) => {
	const tx = withdraw(store, token)
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
