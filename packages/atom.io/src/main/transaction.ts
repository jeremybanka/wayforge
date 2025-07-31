import type { findState, getState, setState } from "atom.io"
import type { EnvironmentData, Func, Transceiver } from "atom.io/internal"
import {
	actUponStore,
	arbitrary,
	createTransaction,
	IMPLICIT,
} from "atom.io/internal"
import type { Canonical, Json, stringified } from "atom.io/json"

import type {
	disposeState,
	KeyedStateUpdate,
	MutableAtomToken,
	ReadableToken,
	TokenType,
	WritablePureSelectorToken,
} from "."
import type { resetState } from "./reset-state"

/** @public */
export type TransactionToken<F extends Func> = {
	/** The unique identifier of the transaction */
	key: string
	/** Discriminator */
	type: `transaction`
	/** Never present. This is a marker that preserves the type of the transaction function */
	__F?: F
}

/** @public */
export type StateCreation<Token extends ReadableToken<any>> = {
	type: `state_creation`
	token: Token
}
/** @public */
export type AtomDisposal<Token extends ReadableToken<any>> = {
	type: `state_disposal`
	subType: `atom`
	token: Token
	value: TokenType<Token>
}
/** @public */
export type SelectorDisposal<Token extends ReadableToken<any>> = {
	type: `state_disposal`
	subType: `selector`
	token: Token
}
/** @public */
export type StateDisposal<Token extends ReadableToken<any>> =
	| AtomDisposal<Token>
	| SelectorDisposal<Token>

/** @public */
export type MoleculeCreation = {
	type: `molecule_creation`
	key: Canonical
	provenance: Canonical
}

/** @public */
export type MoleculeDisposal = {
	type: `molecule_disposal`
	key: Canonical
	provenance: stringified<Canonical>[]
	values: [key: string, value: any][]
}

/** @public */
export type MoleculeTransfer = {
	type: `molecule_transfer`
	key: Canonical
	from: Canonical[]
	to: Canonical[]
}

/** @public */
export type TransactionUpdateContent =
	| KeyedStateUpdate<unknown>
	| MoleculeCreation
	| MoleculeDisposal
	| MoleculeTransfer
	| StateCreation<ReadableToken<unknown>>
	| StateDisposal<ReadableToken<unknown>>
	| TransactionUpdate<Func>

/** @public */
export type TransactionUpdate<F extends Func> = {
	type: `transaction_update`
	key: string
	id: string
	epoch: number
	updates: TransactionUpdateContent[]
	params: Parameters<F>
	output: ReturnType<F>
}

/** @public */
export type GetterToolkit = Pick<SetterToolkit, `find` | `get` | `json`>
/** @public */
export type SetterToolkit = Readonly<{
	get: typeof getState
	set: typeof setState
	find: typeof findState
	json: <T extends Transceiver<any>, J extends Json.Serializable>(
		state: MutableAtomToken<T, J>,
	) => WritablePureSelectorToken<J>
}>
/** @public */
export type ActorToolkit = Readonly<{
	get: typeof getState
	set: typeof setState
	reset: typeof resetState
	find: typeof findState
	json: <T extends Transceiver<any>, J extends Json.Serializable>(
		state: MutableAtomToken<T, J>,
	) => WritablePureSelectorToken<J>
	dispose: typeof disposeState
	run: typeof runTransaction
	env: () => EnvironmentData
}>

/** @public */
export type Read<F extends Func> = (
	toolkit: GetterToolkit,
	...parameters: Parameters<F>
) => ReturnType<F>

/** @public */
export type Write<F extends Func> = (
	toolkit: SetterToolkit,
	...parameters: Parameters<F>
) => ReturnType<F>

/** @public */
export type Transact<F extends Func> = (
	toolkit: ActorToolkit,
	...parameters: Parameters<F>
) => ReturnType<F>

/** @public */
export type TransactionIO<Token extends TransactionToken<any>> =
	Token extends TransactionToken<infer F> ? F : never

/** @public */
export type TransactionOptions<F extends Func> = {
	/** The unique identifier of the transaction */
	key: string
	/** The operation to perform */
	do: Transact<F>
}

/**
 * @public
 * Create a transaction, a mechanism for batching updates multiple states in a single, all-or-nothing operation
 * @param options - {@link TransactionOptions}
 * @returns A reference to the transaction created: a {@link TransactionToken}
 */
export function transaction<F extends Func>(
	options: TransactionOptions<F>,
): TransactionToken<F> {
	return createTransaction(IMPLICIT.STORE, options)
}

/**
 * @public
 * Execute a {@link transaction}
 * @param token - A {@link TransactionToken}
 * @param id - A unique identifier for the transaction. If not provided, a random identifier will be generated
 * @returns A function that can be called to run the transaction with its {@link TransactionIO} parameters
 */
export function runTransaction<F extends Func>(
	token: TransactionToken<F>,
	id: string = arbitrary(),
): (...parameters: Parameters<F>) => ReturnType<F> {
	return actUponStore(IMPLICIT.STORE, token, id)
}
