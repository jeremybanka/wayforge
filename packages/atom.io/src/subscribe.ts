import type { Store } from "atom.io/internal"
import {
	IMPLICIT,
	subscribeToState,
	subscribeToTimeline,
	subscribeToTransaction,
} from "atom.io/internal"

import type {
	FamilyMetadata,
	ReadonlySelectorToken,
	StateToken,
	TimelineToken,
	TimelineUpdate,
	TransactionToken,
	TransactionUpdate,
	ƒn,
} from "."

export type StateUpdate<T> = { newValue: T; oldValue: T }
export type KeyedStateUpdate<T> = StateUpdate<T> & {
	key: string
	family?: FamilyMetadata
}
export type UpdateHandler<T> = (update: StateUpdate<T>) => void

export type TransactionUpdateHandler<ƒ extends ƒn> = (
	data: TransactionUpdate<ƒ>,
) => void

export function subscribe<T>(
	token: ReadonlySelectorToken<T> | StateToken<T>,
	handleUpdate: UpdateHandler<T>,
	key?: string,
	store?: Store,
): () => void
export function subscribe<ƒ extends ƒn>(
	token: TransactionToken<ƒ>,
	handleUpdate: TransactionUpdateHandler<ƒ>,
	key?: string,
	store?: Store,
): () => void
export function subscribe(
	token: TimelineToken,
	handleUpdate: (update: TimelineUpdate | `redo` | `undo`) => void,
	key?: string,
	store?: Store,
): () => void
export function subscribe(
	token:
		| ReadonlySelectorToken<any>
		| StateToken<any>
		| TimelineToken
		| TransactionToken<any>,
	handleUpdate: (update: any) => void,
	key: string = Math.random().toString(36).slice(2),
	store = IMPLICIT.STORE,
): () => void {
	switch (token.type) {
		case `atom`:
		case `readonly_selector`:
		case `selector`:
			return subscribeToState(token, handleUpdate, key, store)
		case `transaction`:
			return subscribeToTransaction(token, handleUpdate, key, store)
		case `timeline`:
			return subscribeToTimeline(token, handleUpdate, key, store)
	}
}
