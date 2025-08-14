import type {
	TransactionOptions,
	TransactionToken,
	TransactionOutcomeEvent,
} from "atom.io"

import { newest } from "../lineage"
import type { Store } from "../store"
import { deposit } from "../store"
import { Subject } from "../subject"
import type { Fn } from "../utility-types"
import { abortTransaction } from "./abort-transaction"
import { applyTransaction } from "./apply-transaction"
import { buildTransaction } from "./build-transaction"

export type Transaction<F extends Fn> = {
	key: string
	type: `transaction`
	install: (store: Store) => void
	subject: Subject<TransactionOutcomeEvent<F>>
	run: (parameters: Parameters<F>, id?: string) => ReturnType<F>
}

export function createTransaction<F extends Fn>(
	store: Store,
	options: TransactionOptions<F>,
): TransactionToken<F> {
	const { key } = options
	const transactionAlreadyExists = store.transactions.has(key)
	const newTransaction: Transaction<F> = {
		key,
		type: `transaction`,
		run: (params: Parameters<F>, id: string) => {
			const childStore = buildTransaction(store, key, params, id)
			try {
				const target = newest(store)
				const { toolkit } = childStore.transactionMeta
				const output = options.do(toolkit, ...params)
				applyTransaction(output, target)
				return output
			} catch (thrown) {
				abortTransaction(target)
				store.logger.warn(`💥`, `transaction`, key, `caught:`, thrown)
				throw thrown
			}
		},
		install: (s) => createTransaction(s, options),
		subject: new Subject(),
	}
	const target = newest(store)
	target.transactions.set(key, newTransaction)
	const token = deposit(newTransaction)
	if (!transactionAlreadyExists) {
		store.on.transactionCreation.next(token)
	}
	return token
}
