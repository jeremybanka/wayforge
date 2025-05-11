import type {
	ReadableToken,
	TimelineManageable,
	TimelineToken,
	TimelineUpdate,
	TransactionToken,
	TransactionUpdateHandler,
	UpdateHandler,
} from "atom.io"
import type { Func, Store } from "atom.io/internal"
import {
	arbitrary,
	subscribeToState,
	subscribeToTimeline,
	subscribeToTransaction,
} from "atom.io/internal"

export function subscribeInStore<T>(
	store: Store,
	token: ReadableToken<T>,
	handleUpdate: UpdateHandler<T>,
	key?: string,
): () => void
export function subscribeInStore<F extends Func>(
	store: Store,
	token: TransactionToken<F>,
	handleUpdate: TransactionUpdateHandler<F>,
	key?: string,
): () => void
export function subscribeInStore<M extends TimelineManageable>(
	store: Store,
	token: TimelineToken<M>,
	handleUpdate: (update: TimelineUpdate<M> | `redo` | `undo`) => void,
	key?: string,
): () => void
export function subscribeInStore<M extends TimelineManageable>(
	store: Store,
	token: ReadableToken<any> | TimelineToken<M> | TransactionToken<any>,
	handleUpdate:
		| TransactionUpdateHandler<any>
		| UpdateHandler<any>
		| ((update: TimelineUpdate<M> | `redo` | `undo`) => void),
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
		case `readonly_selector`:
		case `writable_selector`:
			return subscribeToState(store, token, key, handleUpdate)
		case `transaction`:
			return subscribeToTransaction(store, token, key, handleUpdate)
		case `timeline`:
			return subscribeToTimeline(store, token, key, handleUpdate)
	}
}
