import type {
	ReadableToken,
	TimelineEvent,
	TimelineManageable,
	TimelineToken,
	TransactionToken,
	TransactionUpdateHandler,
	UpdateHandler,
} from "atom.io"

import { arbitrary } from "../arbitrary"
import type { Store } from "../store"
import type { Fn } from "../utility-types"
import { subscribeToState } from "./subscribe-to-state"
import { subscribeToTimeline } from "./subscribe-to-timeline"
import { subscribeToTransaction } from "./subscribe-to-transaction"

export function subscribeInStore<T>(
	store: Store,
	token: ReadableToken<T>,
	handleUpdate: UpdateHandler<T>,
	key?: string,
): () => void
export function subscribeInStore<F extends Fn>(
	store: Store,
	token: TransactionToken<F>,
	handleUpdate: TransactionUpdateHandler<F>,
	key?: string,
): () => void
export function subscribeInStore<M extends TimelineManageable>(
	store: Store,
	token: TimelineToken<M>,
	handleUpdate: (update: TimelineEvent<M> | `redo` | `undo`) => void,
	key?: string,
): () => void
export function subscribeInStore<M extends TimelineManageable>(
	store: Store,
	token: ReadableToken<any> | TimelineToken<M> | TransactionToken<any>,
	handleUpdate:
		| TransactionUpdateHandler<any>
		| UpdateHandler<any>
		| ((update: TimelineEvent<M> | `redo` | `undo`) => void),
	key?: string,
): () => void
export function subscribeInStore(
	store: Store,
	token: ReadableToken<any> | TimelineToken<any> | TransactionToken<any>,
	handleUpdate: (update: any) => void,
	key: string = arbitrary(),
): () => void {
	switch (token.type) {
		case `atom`:
		case `mutable_atom`:
		case `readonly_pure_selector`:
		case `readonly_held_selector`:
		case `writable_pure_selector`:
		case `writable_held_selector`:
			return subscribeToState(store, token, key, handleUpdate)
		case `transaction`:
			return subscribeToTransaction(store, token, key, handleUpdate)
		case `timeline`:
			return subscribeToTimeline(store, token, key, handleUpdate)
	}
}
