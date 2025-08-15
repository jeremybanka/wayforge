import type { Fn, ViewOf } from "atom.io/internal"
import type { Canonical, stringified } from "atom.io/json"

import type { TimelineManageable } from "./timeline"
import type { AtomToken, SelectorToken, WritableToken } from "./tokens"
import type { TokenType } from "./validators"

// operation possibilities
//
// setState(atom)
// - (it exists)
// - AtomUpdateEvent
//
// setState(atom)
// - (it doesn't exist)
// - AtomUpdate
//
// setState(selector)
// - (it exists)
// - operation <- SelectorUpdateEvent
// - set(atom)
// - (it exists)
// - SelectorUpdateEvent <- AtomUpdateEvent
//
//
// set selector

export type StateUpdate<T> = Readonly<{
	newValue: ViewOf<T>
	oldValue: ViewOf<T>
}>

export type StateUpdateEvent<T, K extends Canonical = any> =
	| AtomUpdateEvent<T, K>
	| SelectorUpdateEvent<T, K>

export type AtomUpdateEvent<T, K extends Canonical = any> = Readonly<{
	type: `update`
	subType: `atom`
	token: AtomToken<T, K>
	update: StateUpdate<T>
	timestamp: number
}>
export type SelectorUpdateEvent<T, K extends Canonical = any> = Readonly<{
	type: `update`
	subType: `selector`
	token: SelectorToken<T, K>
	update: StateUpdate<T>
	events: Array<AtomUpdateEvent<T> | CreationEvent<any>>
	timestamp: number
}>

export type CreationEvent<K extends Canonical> = {
	type: `molecule_creation`
	token: { key: K }
	provenance: Canonical
	values: [WritableToken<any, K>, any][]
	timestamp: number
}
export type DisposalEvent = {
	type: `molecule_disposal`
	token: { key: Canonical }
	provenance: stringified<Canonical>[]
	values: [familyKey: string, value: any][]
	timestamp: number
}
export type TransferEvent = {
	type: `molecule_transfer`
	token: { key: Canonical }
	exclusive: boolean
	from: Canonical[]
	to: Canonical[]
	timestamp: number
}

export type TransactionEvent =
	| CreationEvent
	| DisposalEvent
	| StateUpdateEvent<unknown>
	| TransactionOutcomeEvent<Fn>
	| TransferEvent

export type TransactionOutcomeEvent<F extends Fn> = {
	type: `transaction_update`
	token: { key: string }
	id: string
	epoch: number
	events: TransactionEvent[]
	params: Parameters<F>
	output: ReturnType<F>
	timestamp: number
}

// export type Timestamped<T> = T & {  }

export type TimelineEvent<ManagedAtom extends TimelineManageable> =
	| AtomUpdateEvent<TokenType<ManagedAtom>>
	| CreationEvent
	| DisposalEvent
	| SelectorUpdateEvent<any>
	| TransactionOutcomeEvent<any>
	| TransferEvent
