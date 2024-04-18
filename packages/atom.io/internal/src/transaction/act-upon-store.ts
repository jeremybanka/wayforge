import type { Func, TransactionToken } from "atom.io"

import { NotFoundError } from "../not-found-error"
import type { Store } from "../store"
import { withdraw } from "../store"

export function actUponStore<F extends Func>(
	token: TransactionToken<F>,
	id: string,
	store: Store,
): (...parameters: Parameters<F>) => ReturnType<F> {
	return (...parameters: Parameters<F>): ReturnType<F> => {
		const tx = withdraw(token, store)
		if (tx) {
			return tx.run(parameters, id)
		}
		throw new NotFoundError(token, store)
	}
}
