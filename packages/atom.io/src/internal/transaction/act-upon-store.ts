import type { TransactionToken } from "atom.io"

import { NotFoundError } from "../not-found-error"
import type { Store } from "../store"
import { withdraw } from "../store"
import type { Func } from "../utility-types"

export function actUponStore<F extends Func>(
	store: Store,
	token: TransactionToken<F>,
	id: string,
): (...parameters: Parameters<F>) => ReturnType<F> {
	// if (store.config.name === `jane`) debugger
	return (...parameters: Parameters<F>): ReturnType<F> => {
		const tx = withdraw(store, token)
		if (tx) {
			return tx.run(parameters, id)
		}
		throw new NotFoundError(token, store)
	}
}
