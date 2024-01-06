import type { EnvironmentData, Store } from "atom.io/internal"
import { IMPLICIT, createTransaction, withdraw } from "atom.io/internal"
import type { Json } from "atom.io/json"

import type {
	KeyedStateUpdate,
	ReadonlySelectorToken,
	WritableToken,
	findState,
	ƒn,
} from "."

export type TransactionToken<_> = {
	key: string
	type: `transaction`
	__brand?: _
}

export type TransactionUpdateContent =
	| KeyedStateUpdate<unknown>
	| TransactionUpdate<ƒn>

export type TransactionUpdate<ƒ extends ƒn> = {
	key: string
	id: string
	updates: TransactionUpdateContent[]
	params: Parameters<ƒ>
	output: ReturnType<ƒ>
}

export type Transactors = Readonly<{
	get: <S>(state: ReadonlySelectorToken<S> | WritableToken<S>) => S
	set: <S, New extends S>(
		state: WritableToken<S>,
		newValue: New | ((oldValue: S) => New),
	) => void
	find: typeof findState
}>
export type TransactorsWithRunAndEnv = Readonly<{
	get: <S>(state: ReadonlySelectorToken<S> | WritableToken<S>) => S
	set: <S, New extends S>(
		state: WritableToken<S>,
		newValue: New | ((oldValue: S) => New),
	) => void
	find: typeof findState
	run: typeof runTransaction
	env: () => EnvironmentData
}>
export type ReadonlyTransactors = Pick<Transactors, `find` | `get`>

export type Read<ƒ extends ƒn> = (
	transactors: ReadonlyTransactors,
	...parameters: Parameters<ƒ>
) => ReturnType<ƒ>

export type Write<ƒ extends ƒn> = (
	transactors: Transactors,
	...parameters: Parameters<ƒ>
) => ReturnType<ƒ>

export type Transact<ƒ extends ƒn> = (
	transactors: TransactorsWithRunAndEnv,
	...parameters: Parameters<ƒ>
) => ReturnType<ƒ>

export type TransactionOptions<ƒ extends ƒn> = {
	key: string
	do: Transact<ƒ>
}

export type TransactionIO<Token extends TransactionToken<any>> =
	Token extends TransactionToken<infer ƒ> ? ƒ : never

export function transaction<ƒ extends ƒn>(
	options: TransactionOptions<ƒ>,
): TransactionToken<ƒ> {
	return createTransaction(options, IMPLICIT.STORE)
}

export const runTransaction =
	<ƒ extends ƒn>(
		token: TransactionToken<ƒ>,
		store: Store = IMPLICIT.STORE,
		id?: string,
	) =>
	(...parameters: Parameters<ƒ>): ReturnType<ƒ> => {
		const tx = withdraw(token, store)
		if (tx) {
			return tx.run(parameters, id)
		}
		throw new Error(
			`Cannot run transaction "${token.key}": transaction not found in store "${store.config.name}".`,
		)
	}
