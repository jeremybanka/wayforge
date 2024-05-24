import type { findState } from "atom.io/ephemeral"
import type {
	makeMolecule,
	MoleculeConstructor,
	MoleculeFamilyToken,
	MoleculeParams,
	MoleculeToken,
	seekState,
} from "atom.io/immortal"
import type { EnvironmentData, Transceiver } from "atom.io/internal"
import {
	actUponStore,
	arbitrary,
	createTransaction,
	IMPLICIT,
} from "atom.io/internal"
import type { Json } from "atom.io/json"

import type {
	disposeState,
	Func,
	KeyedStateUpdate,
	MutableAtomToken,
	ReadableToken,
	ReadonlySelectorToken,
	TokenType,
	WritableSelectorToken,
	WritableToken,
} from "."

export type TransactionToken<F extends Func> = {
	key: string
	type: `transaction`
	__F?: F
}

export type StateCreation<Token extends ReadableToken<any>> = {
	type: `state_creation`
	token: Token
}
export type StateDisposal<Token extends ReadableToken<any>> = {
	type: `state_disposal`
	token: Token
	value?: TokenType<Token>
}

export type MoleculeCreation<
	K extends Json.Serializable,
	C extends MoleculeConstructor<K>,
> = {
	type: `molecule_creation`
	token: MoleculeToken<K, C>
	family: MoleculeFamilyToken<K, C>
	context: MoleculeToken<K, C>[]
	params: MoleculeParams<C>
}
export type MoleculeDisposal<K extends Json.Serializable> = {
	type: `molecule_disposal`
	token: MoleculeToken<K, MoleculeConstructor<K>>
	family: MoleculeFamilyToken<K, MoleculeConstructor<K>>
	context: MoleculeToken<K, MoleculeConstructor<K>>[]
	familyKeys: string[]
}

export type TransactionUpdateContent =
	| KeyedStateUpdate<unknown>
	| MoleculeCreation<any, any>
	| MoleculeDisposal<any>
	| StateCreation<ReadableToken<unknown>>
	| StateDisposal<ReadableToken<unknown>>
	| TransactionUpdate<Func>

export type TransactionUpdate<F extends Func> = {
	type: `transaction_update`
	key: string
	id: string
	epoch: number
	updates: TransactionUpdateContent[]
	params: Parameters<F>
	output: ReturnType<F>
}

export type Transactors = Readonly<{
	get: <S>(state: ReadableToken<S>) => S
	set: <S, New extends S>(
		state: WritableToken<S>,
		newValue: New | ((oldValue: S) => New),
	) => void
	find: typeof findState
	seek: typeof seekState
	json: <T extends Transceiver<any>, J extends Json.Serializable>(
		state: MutableAtomToken<T, J>,
	) => WritableSelectorToken<J>
}>
export type TransactorsWithRunAndEnv = Readonly<{
	get: <S>(state: ReadonlySelectorToken<S> | WritableToken<S>) => S
	set: <S, New extends S>(
		state: WritableToken<S>,
		newValue: New | ((oldValue: S) => New),
	) => void
	find: typeof findState
	seek: typeof seekState
	json: <T extends Transceiver<any>, J extends Json.Serializable>(
		state: MutableAtomToken<T, J>,
	) => WritableSelectorToken<J>
	make: typeof makeMolecule
	dispose: typeof disposeState
	run: typeof runTransaction
	env: () => EnvironmentData
}>
export type ReadonlyTransactors = Pick<
	Transactors,
	`find` | `get` | `json` | `seek`
>

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
