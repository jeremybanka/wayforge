import type { ViewOf } from "atom.io"
import type { Canonical, stringified } from "atom.io/json"

import type { AtomOnly, TimelineManageable } from "./timeline"
import type { AtomToken, SelectorToken, TransactionToken } from "./tokens"
import type { TokenType } from "./validators"

export type StateUpdate<T> = {
	readonly oldValue: ViewOf<T>
	readonly newValue: ViewOf<T>
}

export type AtomUpdateEvent<A extends AtomToken<any>> = {
	type: `atom_update`
	token: A
	update: StateUpdate<TokenType<A>>
	timestamp: number
}

export type SelectorUpdateEvent<
	S extends SelectorToken<any>,
	A extends AtomToken<any> = AtomToken<any>,
> = {
	type: `selector_update`
	token: S
	timestamp: number
	subEvents: SelectorSubEvent<A>[]
}
export type SelectorSubEvent<A extends AtomToken<any>> =
	| AtomCreationEvent<A>
	| AtomUpdateEvent<A>
	| SelectorCreationEvent<any, A>

export type StateLifecycleEvent = StateCreationEvent | StateDisposalEvent
export type StateCreationEvent =
	| AtomCreationEvent<any>
	| SelectorCreationEvent<any, any>
export type StateDisposalEvent =
	| AtomDisposalEvent<any>
	| SelectorDisposalEvent<any>

export type AtomCreationEvent<A extends AtomToken<any>> = {
	type: `state_creation`
	subType: `atom`
	token: A
	timestamp: number
	value?: TokenType<A>
}
export type SelectorCreationEvent<
	S extends SelectorToken<any>,
	A extends AtomToken<any> = AtomToken<any>,
> = {
	type: `state_creation`
	subType: `selector`
	token: S
	timestamp: number
	subEvents: SelectorSubEvent<A>[]
}

export type AtomDisposalEvent<A extends AtomToken<any>> = {
	type: `state_disposal`
	subType: `atom`
	token: A
	value: TokenType<A>
	timestamp: number
}
export type SelectorDisposalEvent<S extends SelectorToken<any>> = {
	type: `state_disposal`
	subType: `selector`
	token: S
	timestamp: number
}

export type MoleculeCreationEvent = {
	type: `molecule_creation`
	key: Canonical
	provenance: Canonical
	timestamp: number
}

export type MoleculeDisposalEvent = {
	type: `molecule_disposal`
	key: Canonical
	provenance: stringified<Canonical>[]
	values: [key: string, value: any][]
	timestamp: number
}

export type MoleculeTransferEvent = {
	type: `molecule_transfer`
	key: Canonical
	exclusive: boolean
	from: Canonical[]
	to: Canonical[]
	timestamp: number
}

export type TransactionSubEvent =
	| AtomUpdateEvent<any>
	| MoleculeCreationEvent
	| MoleculeDisposalEvent
	| MoleculeTransferEvent
	| StateCreationEvent
	| StateDisposalEvent
	| TransactionOutcomeEvent<TransactionToken<any>>

export type TransactionOutcomeEvent<T extends TransactionToken<any>> = {
	type: `transaction_outcome`
	token: T
	id: string
	epoch: number
	timestamp: number
	subEvents: TransactionSubEvent[]
	params: Parameters<TokenType<T>>
	output: ReturnType<TokenType<T>>
}

export type TimelineEvent<ManagedAtom extends TimelineManageable> =
	| AtomCreationEvent<AtomOnly<ManagedAtom>>
	| AtomDisposalEvent<AtomOnly<ManagedAtom>>
	| AtomUpdateEvent<AtomOnly<ManagedAtom>>
	| MoleculeCreationEvent
	| MoleculeDisposalEvent
	| SelectorCreationEvent<any, AtomOnly<ManagedAtom>>
	| SelectorDisposalEvent<any>
	| SelectorUpdateEvent<any, AtomOnly<ManagedAtom>>
	| TransactionOutcomeEvent<TransactionToken<any>>
