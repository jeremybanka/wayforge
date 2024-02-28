import type { TransactionToken, TransactionUpdateHandler, ƒn } from "atom.io"
import type { Store } from ".."
import { withdraw } from ".."

export const subscribeToTransaction = <ƒ extends ƒn>(
	token: TransactionToken<ƒ>,
	handleUpdate: TransactionUpdateHandler<ƒ>,
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
