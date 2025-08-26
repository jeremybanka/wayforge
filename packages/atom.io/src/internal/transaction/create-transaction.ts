import type {
	TransactionOptions,
	TransactionOutcomeEvent,
	TransactionToken,
} from "atom.io"

import { newest } from "../lineage"
import { deposit } from "../store"
import { Subject } from "../subject"
import type { Fn } from "../utility-types"
import { abortTransaction } from "./abort-transaction"
import { applyTransaction } from "./apply-transaction"
import { buildTransaction } from "./build-transaction"
import type { RootStore } from "./is-root-store"

export type Transaction<F extends Fn> = {
	key: string
	type: `transaction`
	install: (store: RootStore) => void
	subject: Subject<TransactionOutcomeEvent<TransactionToken<F>>>
	run: (parameters: Parameters<F>, id?: string) => ReturnType<F>
}

export function createTransaction<F extends Fn>(
	store: RootStore,
	options: TransactionOptions<F>,
): TransactionToken<F> {
	const { key } = options
	const transactionAlreadyExists = store.transactions.has(key)
	const newTransaction: Transaction<F> = {
		key,
		type: `transaction`,
		run: (params: Parameters<F>, id: string) => {
			const token = deposit(newTransaction)
			const target = buildTransaction(store, token, params, id)
			try {
				const { toolkit } = target.transactionMeta
				const output = options.do(toolkit, ...params)
				applyTransaction<F>(target, output)
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
