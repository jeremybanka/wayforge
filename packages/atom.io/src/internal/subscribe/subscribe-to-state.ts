import type { ReadableToken, StateUpdate, UpdateHandler } from "atom.io"

import type { Store } from "../store"
import { withdraw } from "../store"
import { subscribeToRootAtoms } from "./subscribe-to-root-atoms"

export function subscribeToState<T>(
	store: Store,
	token: ReadableToken<T>,
	key: string,
	handleUpdate: UpdateHandler<T>,
): () => void {
	function safelyHandleUpdate(update: StateUpdate<any>): void {
		if (store.operation.open) {
			const unsubscribe = store.on.operationClose.subscribe(
				`state subscription ${key}`,
				() => {
					unsubscribe()
					handleUpdate(update)
				},
			)
		} else {
			handleUpdate(update)
		}
	}
	const state = withdraw(store, token)
	store.logger.info(`👀`, state.type, state.key, `Adding subscription "${key}"`)
	const isSelector =
		state.type === `writable_selector` || state.type === `readonly_selector`
	let dependencyUnsubFunctions: (() => void)[] | null = null
	let updateHandler: UpdateHandler<T> = safelyHandleUpdate
	if (isSelector) {
		dependencyUnsubFunctions = subscribeToRootAtoms(store, state)
		updateHandler = (update) => {
			if (dependencyUnsubFunctions) {
				dependencyUnsubFunctions.length = 0
				dependencyUnsubFunctions.push(...subscribeToRootAtoms(store, state))
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
		if (dependencyUnsubFunctions) {
			for (const unsubFromDependency of dependencyUnsubFunctions) {
				unsubFromDependency()
			}
		}
	}

	return unsubscribe
}
