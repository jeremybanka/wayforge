import type { Canonical, stringified } from "atom.io/json"

import type { AtomOnly, TimelineManageable } from "./timeline"
import type {
	AtomToken,
	ReadableToken,
	SelectorToken,
	TransactionToken,
} from "./tokens"
import type { TokenType } from "./validators"

export type StateUpdate<T> = { newValue: T; oldValue: T }

export type AtomUpdateEvent<T extends AtomToken<any>> = {
	type: `atom_update`
	token: T
	update: StateUpdate<TokenType<T>>
	timestamp: number
}

export type TimelineSelectorUpdateEvent<ManagedAtom extends TimelineManageable> =
	{
		type: `selector_update`
		token: SelectorToken<any>
		atomUpdates: AtomUpdateEvent<AtomOnly<ManagedAtom>>[]
		timestamp: number
	}

export type StateLifecycleEvent<Token extends ReadableToken<any>> =
	| StateCreationEvent<Token>
	| StateDisposalEvent<Token>
export type StateCreationEvent<Token extends ReadableToken<any>> = {
	type: `state_creation`
	token: Token
}
export type StateDisposalEvent<Token extends ReadableToken<any>> =
	| AtomDisposalEvent<Token>
	| SelectorDisposalEvent<Token>

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

export type MoleculeTransferEvent = {
	type: `molecule_transfer`
	key: Canonical
	exclusive: boolean
	from: Canonical[]
	to: Canonical[]
}

export type TransactionSubEvent =
	| AtomUpdateEvent<AtomToken<any>>
	| MoleculeCreationEvent
	| MoleculeDisposalEvent
	| MoleculeTransferEvent
	| StateCreationEvent<ReadableToken<unknown>>
	| StateDisposalEvent<ReadableToken<unknown>>
	| TransactionOutcomeEvent<TransactionToken<any>>

export type TransactionOutcomeEvent<T extends TransactionToken<any>> = {
	type: `transaction_outcome`
	token: T
	id: string
	epoch: number
	subEvents: TransactionSubEvent[]
	params: Parameters<TokenType<T>>
	output: ReturnType<TokenType<T>>
}

export type TimelineEvent<ManagedAtom extends TimelineManageable> = {
	timestamp: number
} & (
	| AtomUpdateEvent<AtomOnly<ManagedAtom>>
	| MoleculeCreationEvent
	| MoleculeDisposalEvent
	| StateCreationEvent<AtomOnly<ManagedAtom>>
	| StateDisposalEvent<AtomOnly<ManagedAtom>>
	| TimelineSelectorUpdateEvent<ManagedAtom>
	| TransactionOutcomeEvent<TransactionToken<any>>
)
