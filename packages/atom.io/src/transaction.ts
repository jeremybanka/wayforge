import type { getState, setState } from "atom.io"
import type { findState } from "atom.io/ephemeral"
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
	WritableSelectorToken,
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
export type StateDisposal<Token extends ReadableToken<any>> =
	| AtomDisposal<Token>
	| SelectorDisposal<Token>

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

export type GetterToolkit = Pick<SetterToolkit, `find` | `get` | `json`>
export type SetterToolkit = Readonly<{
	get: typeof getState
	set: typeof setState
	find: typeof findState
	json: <T extends Transceiver<any>, J extends Json.Serializable>(
		state: MutableAtomToken<T, J>,
	) => WritableSelectorToken<J>
}>
export type ActorToolkit = Readonly<{
	get: typeof getState
	set: typeof setState
	find: typeof findState
	json: <T extends Transceiver<any>, J extends Json.Serializable>(
		state: MutableAtomToken<T, J>,
	) => WritableSelectorToken<J>
	dispose: typeof disposeState
	run: typeof runTransaction
	env: () => EnvironmentData
}>

export type Read<F extends Func> = (
	toolkit: GetterToolkit,
	...parameters: Parameters<F>
) => ReturnType<F>

export type Write<F extends Func> = (
	toolkit: SetterToolkit,
	...parameters: Parameters<F>
) => ReturnType<F>

export type Transact<F extends Func> = (
	toolkit: ActorToolkit,
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
