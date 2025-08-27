import type { ViewOf } from "atom.io"
import type { Canonical, stringified } from "atom.io/json"

import type { AtomOnly, TimelineManageable } from "./timeline"
import type {
	AtomToken,
	ReadableToken,
	SelectorToken,
	TransactionToken,
	WritableToken,
} from "./tokens"
import type { TokenType } from "./validators"

export type StateUpdate<T> = {
	readonly oldValue?: ViewOf<T>
	readonly newValue: ViewOf<T>
}

export type AtomUpdateEvent<A extends AtomToken<any>> = {
	type: `atom_update`
	token: A
	update: StateUpdate<TokenType<A>>
	timestamp: number
}

export type SelectorUpdateSubEvent<A extends AtomToken<any>> =
	| AtomUpdateEvent<A>
	| StateCreationEvent<any>
export type TimelineSelectorUpdateEvent<A extends TimelineManageable> = {
	type: `selector_update`
	token: SelectorToken<any>
	subEvents: SelectorUpdateSubEvent<AtomOnly<A>>[]
	timestamp: number
}

export type StateLifecycleEvent<R extends ReadableToken<any>> =
	| StateCreationEvent<R>
	| StateDisposalEvent<R>
export type StateCreationEvent<R extends ReadableToken<any>> =
	| ReadableStateCreationEvent<R>
	| (R extends WritableToken<any> ? WritableStateCreationEvent<R> : never)
export type ReadableStateCreationEvent<R extends ReadableToken<any>> = {
	type: `state_creation`
	subType: `readable`
	token: R
	timestamp: number
}
export type WritableStateCreationEvent<W extends WritableToken<any>> = {
	type: `state_creation`
	subType: `writable`
	token: W
	timestamp: number
	value?: TokenType<W>
}
export type StateDisposalEvent<R extends ReadableToken<any>> =
	| AtomDisposalEvent<R>
	| SelectorDisposalEvent<R>
export type AtomDisposalEvent<R extends ReadableToken<any>> = {
	type: `state_disposal`
	subType: `atom`
	token: R
	value: TokenType<R>
	timestamp: number
}
export type SelectorDisposalEvent<R extends ReadableToken<any>> = {
	type: `state_disposal`
	subType: `selector`
	token: R
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
	timestamp: number
	subEvents: TransactionSubEvent[]
	params: Parameters<TokenType<T>>
	output: ReturnType<TokenType<T>>
}

export type TimelineEvent<ManagedAtom extends TimelineManageable> = {
	checkpoint?: true
} & (
	| AtomUpdateEvent<AtomOnly<ManagedAtom>>
	| StateCreationEvent<AtomOnly<ManagedAtom>>
	| StateDisposalEvent<AtomOnly<ManagedAtom>>
	| TimelineSelectorUpdateEvent<ManagedAtom>
	| TransactionOutcomeEvent<TransactionToken<any>>
)
