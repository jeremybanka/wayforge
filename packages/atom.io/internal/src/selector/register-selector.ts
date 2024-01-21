import type { Transactors, findState } from "atom.io"

import { findInStore } from "../families"
import { newest } from "../lineage"
import { readOrComputeValue } from "../read-or-compute-value"
import { setAtomOrSelector } from "../set-state"
import type { Store } from "../store"
import { withdraw, withdrawNewFamilyMember } from "../store"
import { updateSelectorAtoms } from "./update-selector-atoms"

export const registerSelector = (
	selectorKey: string,
	store: Store,
): Transactors => ({
	get: (dependency) => {
		const target = newest(store)

		const dependencyState =
			withdraw(dependency, store) ?? withdrawNewFamilyMember(dependency, store)
		if (dependencyState === undefined) {
			throw new Error(
				`State "${dependency.key}" not found in store "${store.config.name}".`,
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
		if (state === undefined) {
			throw new Error(
				`State "${WritableToken.key}" not found in this store. Did you forget to initialize with the "atom" or "selector" function?`,
			)
		}
		setAtomOrSelector(state, newValue, store)
	},
	find: ((token, key) => findInStore(token, key, store)) as typeof findState,
})
