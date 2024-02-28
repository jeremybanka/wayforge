import type { Transactors, findState } from "atom.io"

import { findInStore } from "../families"
import { readOrComputeValue } from "../get-state/read-or-compute-value"
import { newest } from "../lineage"
import { setAtomOrSelector } from "../set-state"
import type { Store } from "../store"
import { withdrawOrCreate } from "../store"
import { updateSelectorAtoms } from "./update-selector-atoms"

export const registerSelector = (
	selectorKey: string,
	store: Store,
): Transactors => ({
	get: (dependency) => {
		const target = newest(store)

		const dependencyState = withdrawOrCreate(dependency, store)
		const dependencyValue = readOrComputeValue(dependencyState, store)

		store.logger.info(
			`🔌`,
			`selector`,
			selectorKey,
			`registers dependency ( "${dependency.key}" =`,
			dependencyValue,
			`)`,
		)

		target.selectorGraph.set(
			{
				upstreamSelectorKey: dependency.key,
				downstreamSelectorKey: selectorKey,
			},
			{
				source: dependency.key,
			},
		)
		updateSelectorAtoms(selectorKey, dependency, store)
		return dependencyValue
	},
	set: (WritableToken, newValue) => {
		const state = withdrawOrCreate(WritableToken, store)
		setAtomOrSelector(state, newValue, store)
	},
	find: ((token, key) => findInStore(token, key, store)) as typeof findState,
})
