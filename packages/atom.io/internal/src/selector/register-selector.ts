import type { Transactors } from "atom.io"

import { newest } from "../lineage"
import { readOrComputeValue } from "../read-or-compute-value"
import { setAtomOrSelector } from "../set-state"
import type { Store } from "../store"
import { withdraw } from "../store"
import { updateSelectorAtoms } from "./update-selector-atoms"

export const registerSelector = (
	selectorKey: string,
	store: Store,
): Transactors => ({
	get: (dependency) => {
		const target = newest(store)
		const alreadyRegistered = target.selectorGraph
			.getRelationEntries({ downstreamSelectorKey: selectorKey })
			.some(([_, { source }]) => source === dependency.key)

		const dependencyState = withdraw(dependency, store)
		if (dependencyState === undefined) {
			throw new Error(
				`State "${dependency.key}" not found in this store. Did you forget to initialize with the "atom" or "selector" function?`,
			)
		}
		const dependencyValue = readOrComputeValue(dependencyState, store)

		store.logger.info(
			`🔌`,
			`selector`,
			selectorKey,
			`registers dependency ( "${dependency.key}" =`,
			dependencyValue,
			`)`,
		)

		if (!alreadyRegistered) {
			target.selectorGraph = target.selectorGraph.set(
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
