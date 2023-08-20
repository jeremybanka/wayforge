import type { Store } from "atom.io/internal"
import { IMPLICIT, subscribeToRootAtoms, withdraw } from "atom.io/internal"

import type {
	ƒn,
	ReadonlySelectorToken,
	StateToken,
	TimelineToken,
	TimelineUpdate,
	TransactionToken,
	TransactionUpdate,
} from "."

export type StateUpdate<T> = { newValue: T; oldValue: T }
export type KeyedStateUpdate<T> = StateUpdate<T> & { key: string }
export type UpdateHandler<T> = (update: StateUpdate<T>) => void

export const subscribe = <T>(
	token: ReadonlySelectorToken<T> | StateToken<T>,
	handleUpdate: UpdateHandler<T>,
	store: Store = IMPLICIT.STORE,
): (() => void) => {
	const state = withdraw<T>(token, store)
	if (state === null) {
		throw new Error(
			`State "${token.key}" not found in this store. Did you forget to initialize with the "atom" or "selector" function?`,
		)
	}
	const subscription = state.subject.subscribe(handleUpdate)
	store.config.logger?.info(`👀 subscribe to "${state.key}"`)
	const dependencySubscriptions =
		state.type !== `atom` ? subscribeToRootAtoms(state, store) : null

	const unsubscribe =
		dependencySubscriptions === null
			? () => {
					store.config.logger?.info(`🙈 unsubscribe from "${state.key}"`)
					subscription.unsubscribe()
			  }
			: () => {
					store.config.logger?.info(
						`🙈 unsubscribe from "${state.key}" and its dependencies`,
					)
					subscription.unsubscribe()
					for (const dependencySubscription of dependencySubscriptions) {
						dependencySubscription.unsubscribe()
					}
			  }

	return unsubscribe
}

export type TransactionUpdateHandler<ƒ extends ƒn> = (
	data: TransactionUpdate<ƒ>,
) => void

export const subscribeToTransaction = <ƒ extends ƒn>(
	token: TransactionToken<ƒ>,
	handleUpdate: TransactionUpdateHandler<ƒ>,
	store = IMPLICIT.STORE,
): (() => void) => {
	const tx = withdraw(token, store)
	if (tx === null) {
		throw new Error(
			`Cannot subscribe to transaction "${token.key}": transaction not found in store "${store.config.name}".`,
		)
	}
	store.config.logger?.info(`👀 subscribe to transaction "${token.key}"`)
	const subscription = tx.subject.subscribe(handleUpdate)
	const unsubscribe = () => {
		store.config.logger?.info(`🙈 unsubscribe from transaction "${token.key}"`)
		subscription.unsubscribe()
	}
	return unsubscribe
}

export const subscribeToTimeline = (
	token: TimelineToken,
	handleUpdate: (update: TimelineUpdate | `redo` | `undo`) => void,
	store = IMPLICIT.STORE,
): (() => void) => {
	const tl = withdraw(token, store)
	if (tl === null) {
		throw new Error(
			`Cannot subscribe to timeline "${token.key}": timeline not found in store "${store.config.name}".`,
		)
	}
	store.config.logger?.info(`👀 subscribe to timeline "${token.key}"`)
	const subscription = tl.subject.subscribe(handleUpdate)
	const unsubscribe = () => {
		store.config.logger?.info(`🙈 unsubscribe from timeline "${token.key}"`)
		subscription.unsubscribe()
	}
	return unsubscribe
}
