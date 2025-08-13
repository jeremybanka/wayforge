import type { Flat, Fn, ViewOf } from "atom.io/internal"
import type { Canonical, stringified } from "atom.io/json"

import type { AtomOnly, TimelineManageable } from "./timeline"
import type { FamilyMetadata, ReadableToken } from "./tokens"
import type { TokenType } from "./validators"

export type StateUpdate<T> = { newValue: ViewOf<T>; oldValue: ViewOf<T> }
export type KeyedStateUpdate<T> = Flat<
	StateUpdate<T> & {
		key: string
		type: `atom_update` | `selector_update`
		family?: FamilyMetadata
	}
>

export type AtomCreation<Token extends ReadableToken<any>> = {
	type: `state_creation`
	subType: `atom`
	token: Token
	value: TokenType<Token>
}
export type SelectorCreation<Token extends ReadableToken<any>> = {
	type: `state_creation`
	subType: `selector`
	token: Token
	value: TokenType<Token>
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

export type StateCreation<Token extends ReadableToken<any>> =
	| AtomCreation<Token>
	| SelectorCreation<Token>
export type StateDisposal<Token extends ReadableToken<any>> =
	| AtomDisposal<Token>
	| SelectorDisposal<Token>
export type StateLifecycleEvent<Token extends ReadableToken<any>> =
	| StateCreation<Token>
	| StateDisposal<Token>

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
	exclusive: boolean
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
	| TransactionUpdate<Fn>

export type TransactionUpdate<F extends Fn> = {
	type: `transaction_update`
	key: string
	id: string
	epoch: number
	updates: TransactionUpdateContent[]
	params: Parameters<F>
	output: ReturnType<F>
}

export type TimelineAtomUpdate<ManagedAtom extends TimelineManageable> = Flat<
	StateUpdate<TokenType<ManagedAtom>> & {
		key: string
		type: `atom_update`
		timestamp: number
		family?: FamilyMetadata
	}
>
export type TimelineSelectorUpdate<ManagedAtom extends TimelineManageable> = {
	key: string
	type: `selector_update`
	timestamp: number
	atomUpdates: Omit<TimelineAtomUpdate<ManagedAtom>, `timestamp`>[]
}
export type TimelineTransactionUpdate = Flat<
	TransactionUpdate<Fn> & {
		key: string
		type: `transaction_update`
		timestamp: number
	}
>
export type TimelineStateCreation<T extends ReadableToken<any>> = Flat<
	StateCreation<T> & { timestamp: number }
>
export type TimelineStateDisposal<T extends ReadableToken<any>> = Flat<
	StateDisposal<T> & { timestamp: number }
>
export type TimelineMoleculeCreation = Flat<
	MoleculeCreation & { timestamp: number }
>
export type TimelineMoleculeDisposal = Flat<
	MoleculeDisposal & { timestamp: number }
>

export type TimelineUpdate<ManagedAtom extends TimelineManageable> =
	| TimelineAtomUpdate<ManagedAtom>
	| TimelineMoleculeCreation
	| TimelineMoleculeDisposal
	| TimelineSelectorUpdate<ManagedAtom>
	| TimelineStateCreation<AtomOnly<ManagedAtom>>
	| TimelineStateDisposal<AtomOnly<ManagedAtom>>
	| TimelineTransactionUpdate
