import type { TransactionToken, TransactionUpdateHandler } from "atom.io"

import type { Store } from "../store"
import { withdraw } from "../store"
import type { Fn } from "../utility-types"

export const subscribeToTransaction = <F extends Fn>(
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
