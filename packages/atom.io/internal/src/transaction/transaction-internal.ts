import type {
	TransactionOptions,
	TransactionToken,
	TransactionUpdate,
	ƒn,
} from "atom.io"
import { getState, setState } from "atom.io"

import { IMPLICIT, type Store, type StoreCore, deposit } from "../store"
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

export function transaction__INTERNAL<ƒ extends ƒn>(
	options: TransactionOptions<ƒ>,
	store: Store = IMPLICIT.STORE,
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
					},
					...params,
				)
				applyTransaction(output, store)
				return output
			} catch (thrown) {
				abortTransaction(store)
				store.logger.error(
					`❌ Transaction "${options.key}" failed in store "${store.config.name}":`,
					thrown,
				)
				throw thrown
			}
		},
		install: (store) => transaction__INTERNAL(options, store),
		subject: new Subject(),
	}
	const core = target(store)
	core.transactions.set(newTransaction.key, newTransaction)
	const token = deposit(newTransaction)
	store.subject.transactionCreation.next(token)
	return token
}

export const target = (store: Store = IMPLICIT.STORE): StoreCore =>
	store.transactionStatus.phase === `building`
		? store.transactionStatus.core
		: store
