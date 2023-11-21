import type { Store } from "atom.io/internal"
import { IMPLICIT, subscribeToRootAtoms, withdraw } from "atom.io/internal"

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

export function subscribe<T>(
	token: ReadonlySelectorToken<T> | StateToken<T>,
	handleUpdate: UpdateHandler<T>,
	key: string = Math.random().toString(36).slice(2),
	store: Store = IMPLICIT.STORE,
): () => void {
	const state = withdraw<T>(token, store)
	if (state === undefined) {
		throw new Error(
			`State "${token.key}" not found in this store. Did you forget to initialize with the "atom" or "selector" function?`,
		)
	}
	const unsubFunction = state.subject.subscribe(key, handleUpdate)
	store.logger.info(`👀`, state.type, state.key, `Adding subscription "${key}"`)
	const dependencyUnsubFunctions =
		state.type !== `atom` ? subscribeToRootAtoms(state, store) : null

	const unsubscribe =
		dependencyUnsubFunctions === null
			? () => {
					store.logger.info(
						`🙈`,
						state.type,
						state.key,
						`Removing subscription "${key}"`,
					)
					unsubFunction()
			  }
			: () => {
					store.logger.info(
						`🙈`,
						state.type,
						state.key,
						`Removing subscription "${key}"`,
					)
					unsubFunction()
					for (const unsubFromDependency of dependencyUnsubFunctions) {
						unsubFromDependency()
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
	key: string = Math.random().toString(36).slice(2),
	store = IMPLICIT.STORE,
): (() => void) => {
	const tx = withdraw(token, store)
	if (tx === undefined) {
		throw new Error(
			`Cannot subscribe to transaction "${token.key}": transaction not found in store "${store.config.name}".`,
		)
	}
	store.logger.info(
		`👀`,
		`transaction`,
		token.key,
		`Adding subscription "${key}"`,
	)
	const unsubscribe = tx.subject.subscribe(key, handleUpdate)
	return () => {
		store.logger.info(
			`🙈`,
			`transaction`,
			token.key,
			`Removing subscription "${key}"`,
		)
		unsubscribe()
	}
}

export const subscribeToTimeline = (
	token: TimelineToken,
	handleUpdate: (update: TimelineUpdate | `redo` | `undo`) => void,
	key: string = Math.random().toString(36).slice(2),
	store = IMPLICIT.STORE,
): (() => void) => {
	const tl = withdraw(token, store)
	if (tl === undefined) {
		throw new Error(
			`Cannot subscribe to timeline "${token.key}": timeline not found in store "${store.config.name}".`,
		)
	}
	store.logger.info(`👀`, `timeline`, token.key, `Adding subscription "${key}"`)
	const unsubscribe = tl.subject.subscribe(key, handleUpdate)
	return () => {
		store.logger.info(
			`🙈`,
			`timeline`,
			token.key,
			`Removing subscription "${key}" from timeline`,
		)
		unsubscribe()
	}
}
