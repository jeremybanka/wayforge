import type {
	MoleculeConstructor,
	MoleculeToken,
	ReadableToken,
	Transactors,
} from "atom.io"
import type { findState } from "atom.io/ephemeral"
import type { seekState } from "atom.io/immortal"

import { findInStore, seekInStore } from "../families"
import { getFromStore } from "../get-state"
import { readOrComputeValue } from "../get-state/read-or-compute-value"
import { newest } from "../lineage"
import { getJsonToken } from "../mutable"
import { setAtomOrSelector } from "../set-state"
import type { Store } from "../store"
import { withdraw } from "../store"
import { updateSelectorAtoms } from "./update-selector-atoms"

export const registerSelector = (
	selectorKey: string,
	covered: Set<string>,
	store: Store,
): Transactors => ({
	get: (dependency: MoleculeToken<MoleculeConstructor> | ReadableToken<any>) => {
		const target = newest(store)

		if (dependency.type === `molecule`) {
			return getFromStore(dependency, store)
		}

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
		updateSelectorAtoms(selectorKey, dependency, covered, store)
		return dependencyValue
	},
	set: (WritableToken, newValue) => {
		const target = newest(store)
		const state = withdraw(WritableToken, target)
		setAtomOrSelector(state, newValue, target)
	},
	find: ((token, key) => findInStore(token, key, store)) as typeof findState,
	seek: ((token, key) => seekInStore(token, key, store)) as typeof seekState,
	json: (token) => getJsonToken(token, store),
})
