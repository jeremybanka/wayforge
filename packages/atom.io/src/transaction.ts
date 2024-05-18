import type { findState } from "atom.io/ephemeral"
import type { EnvironmentData } from "atom.io/internal"
import {
	actUponStore,
	arbitrary,
	createTransaction,
	IMPLICIT,
} from "atom.io/internal"

import type { seekState } from "../immortal/src/seek-state"
import type {
	Func,
	KeyedStateUpdate,
	ReadonlySelectorToken,
	WritableToken,
} from "."

export type TransactionToken<F extends Func> = {
	key: string
	type: `transaction`
	__F?: F
}

export type TransactionUpdateContent =
	| KeyedStateUpdate<unknown>
	| TransactionUpdate<Func>

export type TransactionUpdate<F extends Func> = {
	key: string
	id: string
	epoch: number
	updates: TransactionUpdateContent[]
	params: Parameters<F>
	output: ReturnType<F>
}

export type Transactors = Readonly<{
	get: <S>(state: ReadonlySelectorToken<S> | WritableToken<S>) => S
	set: <S, New extends S>(
		state: WritableToken<S>,
		newValue: New | ((oldValue: S) => New),
	) => void
	find: typeof findState
	seek: typeof seekState
}>
export type TransactorsWithRunAndEnv = Readonly<{
	get: <S>(state: ReadonlySelectorToken<S> | WritableToken<S>) => S
	set: <S, New extends S>(
		state: WritableToken<S>,
		newValue: New | ((oldValue: S) => New),
	) => void
	find: typeof findState
	seek: typeof seekState
	run: typeof runTransaction
	env: () => EnvironmentData
}>
export type ReadonlyTransactors = Pick<Transactors, `find` | `get` | `seek`>

export type Read<F extends Func> = (
	transactors: ReadonlyTransactors,
	...parameters: Parameters<F>
) => ReturnType<F>

export type Write<F extends Func> = (
	transactors: Transactors,
	...parameters: Parameters<F>
) => ReturnType<F>

export type Transact<F extends Func> = (
	transactors: TransactorsWithRunAndEnv,
	...parameters: Parameters<F>
) => ReturnType<F>

export type TransactionOptions<F extends Func> = {
	key: string
	do: Transact<F>
}

export type TransactionIO<Token extends TransactionToken<any>> =
	Token extends TransactionToken<infer F> ? F : never

export function transaction<F extends Func>(
	options: TransactionOptions<F>,
): TransactionToken<F> {
	return createTransaction(options, IMPLICIT.STORE)
}

export function runTransaction<F extends Func>(
	token: TransactionToken<F>,
	id = arbitrary(),
): (...parameters: Parameters<F>) => ReturnType<F> {
	return actUponStore(token, id, IMPLICIT.STORE)
}
