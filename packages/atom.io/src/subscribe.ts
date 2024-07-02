import type { Flat, Func, Store } from "atom.io/internal"
import {
	arbitrary,
	IMPLICIT,
	subscribeToState,
	subscribeToTimeline,
	subscribeToTransaction,
} from "atom.io/internal"

import type {
	FamilyMetadata,
	ReadableToken,
	TimelineManageable,
	TimelineToken,
	TimelineUpdate,
	TransactionToken,
	TransactionUpdate,
} from "."

export type StateUpdate<T> = { newValue: T; oldValue: T }
export type KeyedStateUpdate<T> = Flat<
	StateUpdate<T> & {
		key: string
		type: `atom_update` | `selector_update`
		family?: FamilyMetadata
	}
>
export type UpdateHandler<T> = (update: StateUpdate<T>) => void

export type TransactionUpdateHandler<F extends Func> = (
	data: TransactionUpdate<F>,
) => void

export function subscribe<T>(
	token: ReadableToken<T>,
	handleUpdate: UpdateHandler<T>,
	key?: string,
	store?: Store,
): () => void
export function subscribe<F extends Func>(
	token: TransactionToken<F>,
	handleUpdate: TransactionUpdateHandler<F>,
	key?: string,
	store?: Store,
): () => void
export function subscribe<M extends TimelineManageable>(
	token: TimelineToken<M>,
	handleUpdate: (update: TimelineUpdate<M> | `redo` | `undo`) => void,
	key?: string,
	store?: Store,
): () => void
export function subscribe(
	token: ReadableToken<any> | TimelineToken<any> | TransactionToken<any>,
	handleUpdate: (update: any) => void,
	key: string = arbitrary(),
	store = IMPLICIT.STORE,
): () => void {
	switch (token.type) {
		case `atom`:
		case `mutable_atom`:
		case `readonly_selector`:
		case `selector`:
			return subscribeToState(token, handleUpdate, key, store)
		case `transaction`:
			return subscribeToTransaction(token, handleUpdate, key, store)
		case `timeline`:
			return subscribeToTimeline(token, handleUpdate, key, store)
	}
}
