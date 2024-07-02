import type {
	TransactionOptions,
	TransactionToken,
	TransactionUpdate,
} from "atom.io"

import { newest } from "../lineage"
import type { Store } from "../store"
import { deposit } from "../store"
import { Subject } from "../subject"
import type { Func } from "../utility-types"
import { abortTransaction } from "./abort-transaction"
import { applyTransaction } from "./apply-transaction"
import { buildTransaction } from "./build-transaction"

export type Transaction<F extends Func> = {
	key: string
	type: `transaction`
	install: (store: Store) => void
	subject: Subject<TransactionUpdate<F>>
	run: (parameters: Parameters<F>, id?: string) => ReturnType<F>
}

export function createTransaction<F extends Func>(
	options: TransactionOptions<F>,
	store: Store,
): TransactionToken<F> {
	const newTransaction: Transaction<F> = {
		key: options.key,
		type: `transaction`,
		run: (params: Parameters<F>, id: string) => {
			const childStore = buildTransaction(options.key, params, store, id)
			try {
				const target = newest(store)
				const { toolkit } = childStore.transactionMeta
				const output = options.do(toolkit, ...params)
				applyTransaction(output, target)
				return output
			} catch (thrown) {
				abortTransaction(target)
				store.logger.warn(`💥`, `transaction`, options.key, `caught:`, thrown)
				throw thrown
			}
		},
		install: (s) => createTransaction(options, s),
		subject: new Subject(),
	}
	const target = newest(store)
	target.transactions.set(newTransaction.key, newTransaction)
	const token = deposit(newTransaction)
	store.on.transactionCreation.next(token)
	return token
}
