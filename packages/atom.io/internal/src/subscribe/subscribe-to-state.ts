import type { ReadableToken, UpdateHandler } from "atom.io"

import type { Store } from "../store"
import { withdrawOrCreate } from "../store"
import { subscribeToRootAtoms } from "./subscribe-to-root-atoms"

export function subscribeToState<T>(
	token: ReadableToken<T>,
	handleUpdate: UpdateHandler<T>,
	key: string,
	store: Store,
): () => void {
	const state = withdrawOrCreate(token, store)
	store.logger.info(`👀`, state.type, state.key, `Adding subscription "${key}"`)
	const isSelector =
		state.type === `selector` || state.type === `readonly_selector`
	let dependencyUnsubFunctions: (() => void)[] | null = null
	let updateHandler: UpdateHandler<T> = handleUpdate
	if (isSelector) {
		dependencyUnsubFunctions = subscribeToRootAtoms(state, store)
		updateHandler = (update) => {
			if (dependencyUnsubFunctions) {
				dependencyUnsubFunctions.length = 0
				dependencyUnsubFunctions.push(...subscribeToRootAtoms(state, store))
			}
			handleUpdate(update)
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
