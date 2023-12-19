import type { ReadonlySelectorToken, StateToken, UpdateHandler } from "atom.io"
import type { Store } from "../store"
import { withdraw, withdrawNewFamilyMember } from "../store"
import { subscribeToRootAtoms } from "./subscribe-to-root-atoms"

export function subscribeToState<T>(
	token: ReadonlySelectorToken<T> | StateToken<T>,
	handleUpdate: UpdateHandler<T>,
	key: string,
	store: Store,
): () => void {
	const state =
		withdraw<T>(token, store) ?? withdrawNewFamilyMember(token, store)
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
