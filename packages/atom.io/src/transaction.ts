import type { Store } from "atom.io/internal"
import { IMPLICIT, createTransaction, withdraw } from "atom.io/internal"

import type { KeyedStateUpdate, ReadonlySelectorToken, StateToken, ƒn } from "."

export type TransactionToken<_> = {
	key: string
	type: `transaction`
	__brand?: _
}

export type TransactionUpdate<ƒ extends ƒn> = {
	key: string
	updates: (KeyedStateUpdate<unknown> | TransactionUpdate<ƒn>)[]
	params: Parameters<ƒ>
	output: ReturnType<ƒ>
}

export type Transactors = {
	get: <S>(state: ReadonlySelectorToken<S> | StateToken<S>) => S
	set: <S>(state: StateToken<S>, newValue: S | ((oldValue: S) => S)) => void
}
export type ReadonlyTransactors = Pick<Transactors, `get`>

export type Read<ƒ extends ƒn> = (
	transactors: ReadonlyTransactors,
	...parameters: Parameters<ƒ>
) => ReturnType<ƒ>

export type Write<ƒ extends ƒn> = (
	transactors: Transactors,
	...parameters: Parameters<ƒ>
) => ReturnType<ƒ>

export type Act<ƒ extends ƒn> = (
	transactors: Transactors & { run: typeof runTransaction },
	...parameters: Parameters<ƒ>
) => ReturnType<ƒ>

export type TransactionOptions<ƒ extends ƒn> = {
	key: string
	do: Act<ƒ>
}

export type TransactionIO<Token extends TransactionToken<any>> =
	Token extends TransactionToken<infer ƒ> ? ƒ : never

export function transaction<ƒ extends ƒn>(
	options: TransactionOptions<ƒ>,
): TransactionToken<ƒ> {
	return createTransaction(options, IMPLICIT.STORE)
}

export const runTransaction =
	<ƒ extends ƒn>(token: TransactionToken<ƒ>, store: Store = IMPLICIT.STORE) =>
	(...parameters: Parameters<ƒ>): ReturnType<ƒ> => {
		const tx = withdraw(token, store)
		if (tx) {
			return tx.run(...parameters)
		}
		throw new Error(
			`Cannot run transaction "${token.key}": transaction not found in store "${store.config.name}".`,
		)
	}
