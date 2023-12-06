import type {
	TransactionOptions,
	TransactionToken,
	TransactionUpdate,
	ƒn,
} from "atom.io"
import { getState, runTransaction, setState } from "atom.io"

import { newest } from "../lineage"
import { deposit } from "../store"
import type { Store } from "../store"
import { Subject } from "../subject"
import { abortTransaction } from "./abort-transaction"
import { applyTransaction } from "./apply-transaction"
import { buildTransaction } from "./build-transaction"

export type Transaction<ƒ extends ƒn> = {
	key: string
	type: `transaction`
	install: (store: Store) => void
	subject: Subject<TransactionUpdate<ƒ>>
	run: (...parameters: Parameters<ƒ>) => ReturnType<ƒ>
}

export function createTransaction<ƒ extends ƒn>(
	options: TransactionOptions<ƒ>,
	store: Store,
): TransactionToken<ƒ> {
	const newTransaction: Transaction<ƒ> = {
		key: options.key,
		type: `transaction`,
		run: (...params: Parameters<ƒ>) => {
			buildTransaction(options.key, params, store)
			try {
				const output = options.do(
					{
						get: (token) => getState(token, store),
						set: (token, value) => setState(token, value, store),
						run: (token) => runTransaction(token, store),
					},
					...params,
				)
				applyTransaction(output, store)
				return output
			} catch (thrown) {
				abortTransaction(store)
				store.logger.warn(`💥`, `transaction`, options.key, `caught:`, thrown)
				throw thrown
			}
		},
		install: (store) => createTransaction(options, store),
		subject: new Subject(),
	}
	const target = newest(store)
	target.transactions.set(newTransaction.key, newTransaction)
	const token = deposit(newTransaction)
	store.subject.transactionCreation.next(token)
	return token
}
