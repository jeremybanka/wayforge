import type { Flat, Fn } from "atom.io/internal"
import type { Canonical, stringified } from "atom.io/json"

import type { AtomOnly, TimelineManageable } from "./timeline"
import type { FamilyMetadata, ReadableToken } from "./tokens"
import type { TokenType } from "./validators"

export type StateUpdate<T> = { newValue: T; oldValue: T }

export type StateUpdateEvent<T> = AtomUpdateEvent<T>
export type AtomUpdateEvent<T> = Flat<
	StateUpdate<T> & {
		key: string
		type: `atom_update`
		family?: FamilyMetadata
		timestamp: number
	}
>

export type TimelineSelectorUpdateEvent<ManagedAtom extends TimelineManageable> =
	Flat<{
		key: string
		type: `selector_update`
		family?: FamilyMetadata
		atomUpdates: AtomUpdateEvent<ManagedAtom>[]
		timestamp: number
	}>

export type StateCreationEvent<Token extends ReadableToken<any>> = {
	type: `state_creation`
	token: Token
}

export type StateDisposalEvent<Token extends ReadableToken<any>> =
	| AtomDisposalEvent<Token>
	| SelectorDisposalEvent<Token>

export type StateLifecycleEvent<Token extends ReadableToken<any>> =
	| StateCreationEvent<Token>
	| StateDisposalEvent<Token>

export type AtomDisposalEvent<Token extends ReadableToken<any>> = {
	type: `state_disposal`
	subType: `atom`
	token: Token
	value: TokenType<Token>
}
export type SelectorDisposalEvent<Token extends ReadableToken<any>> = {
	type: `state_disposal`
	subType: `selector`
	token: Token
}

export type MoleculeCreationEvent = {
	type: `molecule_creation`
	key: Canonical
	provenance: Canonical
}

export type MoleculeDisposalEvent = {
	type: `molecule_disposal`
	key: Canonical
	provenance: stringified<Canonical>[]
	values: [key: string, value: any][]
}
export type TimelineMoleculeDisposalEvent = Flat<
	MoleculeDisposalEvent & { timestamp: number }
>

export type MoleculeTransferEvent = {
	type: `molecule_transfer`
	key: Canonical
	exclusive: boolean
	from: Canonical[]
	to: Canonical[]
}

export type TransactionUpdateContent =
	| MoleculeCreationEvent
	| MoleculeDisposalEvent
	| MoleculeTransferEvent
	| StateCreationEvent<ReadableToken<unknown>>
	| StateDisposalEvent<ReadableToken<unknown>>
	| StateUpdateEvent<unknown>
	| TransactionOutcomeEvent<Fn>

export type TransactionOutcomeEvent<F extends Fn> = {
	type: `transaction_outcome`
	key: string
	id: string
	epoch: number
	updates: TransactionUpdateContent[]
	params: Parameters<F>
	output: ReturnType<F>
}

export type TimelineEvent<ManagedAtom extends TimelineManageable> = {
	timestamp: number
} & (
	| AtomUpdateEvent<ManagedAtom>
	| MoleculeCreationEvent
	| MoleculeDisposalEvent
	| StateCreationEvent<AtomOnly<ManagedAtom>>
	| StateDisposalEvent<AtomOnly<ManagedAtom>>
	| TimelineSelectorUpdateEvent<ManagedAtom>
	| TransactionOutcomeEvent<Fn>
)
