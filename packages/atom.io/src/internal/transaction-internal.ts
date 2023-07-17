import HAMT from "hamt_plus"

import type { ƒn } from "~/packages/anvl/src/function"

import type { Store, StoreCore } from "."
import {
	Subject,
	abortTransaction,
	applyTransaction,
	buildTransaction,
	deposit,
	IMPLICIT,
} from "."
import type { TransactionOptions, TransactionToken, TransactionUpdate } from ".."
import { getState, setState } from ".."

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
				store.config.logger?.error(`Transaction ${options.key} failed`, thrown)
				throw thrown
			}
		},
		install: (store) => transaction__INTERNAL(options, store),
		subject: new Subject(),
	}
	const core = target(store)
	core.transactions = HAMT.set(
		newTransaction.key,
		newTransaction,
		core.transactions,
	)
	const token = deposit(newTransaction)
	store.subject.transactionCreation.next(token)
	return token
}

export const target = (store: Store = IMPLICIT.STORE): StoreCore =>
	store.transactionStatus.phase === `building`
		? store.transactionStatus.core
		: store
