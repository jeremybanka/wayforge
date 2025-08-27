import type { TransactionToken } from "atom.io"

import type { Store } from "../store"
import { withdraw } from "../store"
import type { Fn } from "../utility-types"

export function actUponStore<F extends Fn>(
	store: Store,
	token: TransactionToken<F>,
	id: string,
): (...parameters: Parameters<F>) => ReturnType<F> {
	return (...parameters: Parameters<F>): ReturnType<F> => {
		const tx = withdraw(store, token)
		return tx.run(parameters, id)
	}
}
