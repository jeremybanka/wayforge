import type { Flat, Fn, ViewOf } from "atom.io/internal"

import type { AtomOnly, TimelineManageable } from "./timeline"
import type { FamilyMetadata, ReadableToken } from "./tokens"
import type {
	MoleculeCreation,
	MoleculeDisposal,
	StateCreation,
	StateDisposal,
	TransactionUpdate,
} from "./transaction"
import type { TokenType } from "./validators"

export type StateUpdate<T> = { newValue: ViewOf<T>; oldValue: ViewOf<T> }
export type KeyedStateUpdate<T> = Flat<
	StateUpdate<T> & {
		key: string
		type: `atom_update` | `selector_update`
		family?: FamilyMetadata
	}
>

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
