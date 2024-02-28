import type { TransactionToken, ƒn } from "atom.io"

import { NotFoundError } from "../not-found-error"
import type { Store } from "../store"
import { withdraw } from "../store"

export function actUponStore<ƒ extends ƒn>(
	token: TransactionToken<ƒ>,
	id: string,
	store: Store,
): (...parameters: Parameters<ƒ>) => ReturnType<ƒ> {
	return (...parameters: Parameters<ƒ>): ReturnType<ƒ> => {
		const tx = withdraw(token, store) // WITHDRAW_ANALYSIS 😡 THROWN ERROR
		if (tx) {
			return tx.run(parameters, id)
		}
		throw new NotFoundError(token, store)
	}
}
