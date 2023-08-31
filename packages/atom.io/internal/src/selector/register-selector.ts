import type { Transactors } from "atom.io"

import { getState__INTERNAL } from "../get-state-internal"
import { setState__INTERNAL } from "../set-state"
import type { Store } from "../store"
import { IMPLICIT, withdraw } from "../store"
import { target } from "../transaction/transaction-internal"
import { updateSelectorAtoms } from "./update-selector-atoms"

export const registerSelector = (
	selectorKey: string,
	store: Store = IMPLICIT.STORE,
): Transactors => ({
	get: (dependency) => {
		const core = target(store)
		const alreadyRegistered = core.selectorGraph
			.getRelationEntries({ downstreamSelectorKey: selectorKey })
			.some(([_, { source }]) => source === dependency.key)

		const dependencyState = withdraw(dependency, store)
		if (dependencyState === null) {
			throw new Error(
				`State "${dependency.key}" not found in this store. Did you forget to initialize with the "atom" or "selector" function?`,
			)
		}
		const dependencyValue = getState__INTERNAL(dependencyState, store)

		if (alreadyRegistered) {
			store.config.logger?.info(
				`   || ${selectorKey} <- ${dependency.key} =`,
				dependencyValue,
			)
		} else {
			store.config.logger?.info(
				`🔌 registerSelector "${selectorKey}" <- ( "${dependency.key}" =`,
				dependencyValue,
				`)`,
			)
			core.selectorGraph = core.selectorGraph.set(
				{
					upstreamSelectorKey: dependency.key,
					downstreamSelectorKey: selectorKey,
				},
				{
					source: dependency.key,
				},
			)
		}
		updateSelectorAtoms(selectorKey, dependency, store)
		return dependencyValue
	},
	set: (stateToken, newValue) => {
		const state = withdraw(stateToken, store)
		if (state === null) {
			throw new Error(
				`State "${stateToken.key}" not found in this store. Did you forget to initialize with the "atom" or "selector" function?`,
			)
		}
		setState__INTERNAL(state, newValue, store)
	},
})
