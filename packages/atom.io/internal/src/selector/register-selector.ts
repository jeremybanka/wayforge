import type { Transactors } from "atom.io"

import { readOrComputeCurrentState } from "../read-or-compute-current-state"
import { setAtomOrSelector } from "../set-state"
import type { Store } from "../store"
import { withdraw } from "../store"
import { target } from "../transaction/transaction-internal"
import { updateSelectorAtoms } from "./update-selector-atoms"

export const registerSelector = (
	selectorKey: string,
	store: Store,
): Transactors => ({
	get: (dependency) => {
		const core = target(store)
		const alreadyRegistered = core.selectorGraph
			.getRelationEntries({ downstreamSelectorKey: selectorKey })
			.some(([_, { source }]) => source === dependency.key)

		const dependencyState = withdraw(dependency, store)
		if (dependencyState === undefined) {
			throw new Error(
				`State "${dependency.key}" not found in this store. Did you forget to initialize with the "atom" or "selector" function?`,
			)
		}
		const dependencyValue = readOrComputeCurrentState(dependencyState, store)

		store.logger.info(
			`🔌`,
			`selector`,
			selectorKey,
			`registers dependency ( "${dependency.key}" =`,
			dependencyValue,
			`)`,
		)

		if (!alreadyRegistered) {
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
		if (state === undefined) {
			throw new Error(
				`State "${stateToken.key}" not found in this store. Did you forget to initialize with the "atom" or "selector" function?`,
			)
		}
		setAtomOrSelector(state, newValue, store)
	},
})
