import type { ReadableToken, StateUpdate, UpdateHandler } from "atom.io"

import { hasRole } from "../atom"
import { readOrComputeValue } from "../get-state"
import { reduceReference } from "../get-state/reduce-reference"
import { traceRootSelectorAtoms } from "../selector"
import type { Store } from "../store"
import { withdraw } from "../store"
import { subscribeToRootDependency } from "./subscribe-to-root-atoms"

export function subscribeToState<T, E>(
	store: Store,
	token: ReadableToken<T, any, E>,
	key: string,
	handleUpdate: UpdateHandler<E | T>,
): () => void {
	function safelyHandleUpdate(update: StateUpdate<any>): void {
		if (
			store.operation.open &&
			state?.type === `atom` &&
			hasRole(state, `tracker:signal`) &&
			`*` + store.operation.token.key === token.key &&
			`inboundTracker` in handleUpdate
		) {
			return

			// const unsubscribe = store.on.operationClose.subscribe(
			// 	`state subscription ${key}`,
			// 	() => {
			// 		unsubscribe()
			// 		handleUpdate(update)
			// 	},
			// )
		}
		handleUpdate(update)
	}
	reduceReference(store, token)
	const state = withdraw(store, token)
	store.logger.info(`👀`, state.type, state.key, `Adding subscription "${key}"`)
	const isSelector =
		state.type === `writable_pure_selector` ||
		state.type === `readonly_pure_selector`
	const rootSubs = new Map<string, () => void>()
	let updateHandler: UpdateHandler<E | T> = safelyHandleUpdate
	if (isSelector) {
		readOrComputeValue(store, state)
		for (const [atomKey, atom] of traceRootSelectorAtoms(store, state.key)) {
			rootSubs.set(atomKey, subscribeToRootDependency(store, state, atom))
		}
		updateHandler = function updateRootsBeforeHandlingUpdate(update) {
			const dependencies = traceRootSelectorAtoms(store, state.key)
			for (const [previousRootKey, unsub] of rootSubs) {
				const currentRoot = dependencies.get(previousRootKey)
				if (currentRoot) {
					dependencies.delete(previousRootKey)
				} else {
					unsub()
					rootSubs.delete(previousRootKey)
				}
			}
			for (const [atomKey, atom] of dependencies) {
				rootSubs.set(atomKey, subscribeToRootDependency(store, state, atom))
			}
			safelyHandleUpdate(update)
		}
	}
	const mainUnsubFunction = state.subject.subscribe(key, updateHandler)
	const unsubscribe = () => {
		store.logger.info(
			`🙈`,
			state.type,
			state.key,
			`Removing subscription "${key}"`,
		)
		mainUnsubFunction()
		for (const unsubFromDependency of rootSubs.values()) {
			unsubFromDependency()
		}
	}

	return unsubscribe
}
