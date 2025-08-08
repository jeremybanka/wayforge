import type {
	AsJSON,
	EnvironmentData,
	Func,
	Transceiver,
} from "atom.io/internal"
import {
	actUponStore,
	arbitrary,
	createTransaction,
	IMPLICIT,
} from "atom.io/internal"
import type { Canonical, stringified } from "atom.io/json"

import type { disposeState } from "./dispose-state"
import type { findState } from "./find-state"
import type { getState } from "./get-state"
import type { resetState } from "./reset-state"
import type { setState } from "./set-state"
import type { KeyedStateUpdate } from "./subscribe"
import type {
	MutableAtomToken,
	ReadableToken,
	TransactionToken,
	WritablePureSelectorToken,
} from "./tokens"
import type { TokenType } from "./validators"

export type StateCreation<Token extends ReadableToken<any>> = {
	type: `state_creation`
	token: Token
}
export type StateDisposal<Token extends ReadableToken<any>> =
	| AtomDisposal<Token>
	| SelectorDisposal<Token>

export type AtomDisposal<Token extends ReadableToken<any>> = {
	type: `state_disposal`
	subType: `atom`
	token: Token
	value: TokenType<Token>
}
export type SelectorDisposal<Token extends ReadableToken<any>> = {
	type: `state_disposal`
	subType: `selector`
	token: Token
}

export type MoleculeCreation = {
	type: `molecule_creation`
	key: Canonical
	provenance: Canonical
}
export type MoleculeDisposal = {
	type: `molecule_disposal`
	key: Canonical
	provenance: stringified<Canonical>[]
	values: [key: string, value: any][]
}
export type MoleculeTransfer = {
	type: `molecule_transfer`
	key: Canonical
	from: Canonical[]
	to: Canonical[]
}

export type TransactionUpdateContent =
	| KeyedStateUpdate<unknown>
	| MoleculeCreation
	| MoleculeDisposal
	| MoleculeTransfer
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

export type ReaderToolkit = Pick<ActorToolkit, `find` | `get` | `json`>
export type WriterToolkit = Pick<ActorToolkit, `find` | `get` | `json` | `set`>
export type ActorToolkit = Readonly<{
	get: typeof getState
	set: typeof setState
	reset: typeof resetState
	find: typeof findState
	json: <T extends Transceiver<any, any>>(
		state: MutableAtomToken<T>,
	) => WritablePureSelectorToken<AsJSON<T>>
	dispose: typeof disposeState
	run: typeof runTransaction
	env: () => EnvironmentData
}>

export type Read<F extends Func> = (
	toolkit: ReaderToolkit,
	...parameters: Parameters<F>
) => ReturnType<F>
export type Write<F extends Func> = (
	toolkit: WriterToolkit,
	...parameters: Parameters<F>
) => ReturnType<F>
export type Transact<F extends Func> = (
	toolkit: ActorToolkit,
	...parameters: Parameters<F>
) => ReturnType<F>
export type TransactionIO<Token extends TransactionToken<any>> =
	Token extends TransactionToken<infer F> ? F : never
export type TransactionOptions<F extends Func> = {
	/** The unique identifier of the transaction */
	key: string
	/** The operation to perform */
	do: Transact<F>
}

/**
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
