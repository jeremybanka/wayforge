import type { Flat, Fn } from "atom.io/internal"
import { arbitrary, IMPLICIT, subscribeInStore } from "atom.io/internal"

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
export type TransactionUpdateHandler<F extends Fn> = (
	data: TransactionUpdate<F>,
) => void

/**
 * Subscribe to a state in the implicit store
 * @param token - The token of the state to subscribe to
 * @param handleUpdate - A function that will be called when the state is updated
 * @param key - A unique key for the subscription. If not provided, a random key will be generated.
 * @returns A function that can be called to unsubscribe from the state
 * @overload State
 */
export function subscribe<T>(
	token: ReadableToken<T>,
	handleUpdate: UpdateHandler<T>,
	key?: string,
): () => void
/**
 * Subscribe to a transaction in the implicit store
 * @param token - The token of the transaction to subscribe to
 * @param handleUpdate - A function that will be called when the transaction succeeds
 * @param key - A unique key for the subscription. If not provided, a random key will be generated.
 * @returns A function that can be called to unsubscribe from the transaction
 * @overload Transaction
 */
export function subscribe<F extends Fn>(
	token: TransactionToken<F>,
	handleUpdate: TransactionUpdateHandler<F>,
	key?: string,
): () => void
/**
 * Subscribe to a timeline in the implicit store
 * @param token - The token of the timeline to subscribe to
 * @param handleUpdate - A function that will be called when a new update is available
 * @param key - A unique key for the subscription. If not provided, a random key will be generated.
 * @returns A function that can be called to unsubscribe from the timeline
 * @overload Timeline
 */
export function subscribe<M extends TimelineManageable>(
	token: TimelineToken<M>,
	handleUpdate: (update: TimelineUpdate<M> | `redo` | `undo`) => void,
	key?: string,
): () => void
export function subscribe(
	token: ReadableToken<any> | TimelineToken<any> | TransactionToken<any>,
	handleUpdate: (update: any) => void,
	key: string = arbitrary(),
): () => void {
	return subscribeInStore(IMPLICIT.STORE, token, handleUpdate, key)
}
