import type { Transactors } from "atom.io"
import type { findState } from "atom.io/ephemeral"
import type { seekState } from "atom.io/immortal"

import { findInStore, seekInStore } from "../families"
import { readOrComputeValue } from "../get-state/read-or-compute-value"
import { newest } from "../lineage"
import { getJsonToken } from "../mutable"
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

		const dependencyState = withdraw(dependency, store)
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
		const state = withdraw(WritableToken, store)
		setAtomOrSelector(state, newValue, store)
	},
	find: ((token, key) => findInStore(token, key, store)) as typeof findState,
	seek: ((token, key) => seekInStore(token, key, store)) as typeof seekState,
	json: (token) => getJsonToken(token, store),
})
