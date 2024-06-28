import type {
	MoleculeConstructor,
	MoleculeFamilyToken,
	MoleculeToken,
	ReadableFamilyToken,
	ReadableToken,
	setState,
	SetterToolkit,
	WritableSelectorFamilyToken,
	WritableToken,
} from "atom.io"
import type { findState } from "atom.io/ephemeral"
import type { seekState } from "atom.io/immortal"
import type { Json } from "atom.io/json"

import { findInStore, seekInStore } from "../families"
import { getFromStore } from "../get-state"
import { readOrComputeValue } from "../get-state/read-or-compute-value"
import { newest } from "../lineage"
import { getJsonToken } from "../mutable"
import { NotFoundError } from "../not-found-error"
import { setAtomOrSelector } from "../set-state"
import type { Store } from "../store"
import { withdraw } from "../store"
import { updateSelectorAtoms } from "./update-selector-atoms"

export const registerSelector = (
	selectorKey: string,
	covered: Set<string>,
	store: Store,
): SetterToolkit => ({
	get: (
		dependency:
			| MoleculeFamilyToken<any>
			| MoleculeToken<MoleculeConstructor>
			| ReadableFamilyToken<any, any>
			| ReadableToken<any>,
		key?: Json.Serializable,
	) => {
		const target = newest(store)

		if (key) {
			switch (dependency.type) {
				case `molecule_family`:
					return getFromStore(dependency, key, store)
				case `atom_family`:
					dependency = seekInStore(dependency, key, store) as any
			}
		}

		if (dependency.type === `molecule`) {
			return getFromStore(dependency, store)
		}

		const dependencyState = withdraw(dependency as ReadableToken<any>, store)
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
		updateSelectorAtoms(selectorKey, dependency as any, covered, store)
		return dependencyValue
	},
	set: (<T, New extends T>(
		...params:
			| [
					token: WritableSelectorFamilyToken<T, any>,
					key: Json.Serializable,
					value: New | ((oldValue: any) => New),
			  ]
			| [token: WritableToken<T>, value: New | ((oldValue: T) => New)]
	) => {
		let token: WritableToken<T>
		let value: New | ((oldValue: T) => New)
		if (params.length === 2) {
			token = params[0]
			value = params[1]
		} else {
			const family = params[0]
			const key = params[1]
			value = params[2]
			const maybeToken =
				store.config.lifespan === `ephemeral`
					? findInStore(family, key, store)
					: seekInStore(family, key, store)
			if (!maybeToken) {
				throw new NotFoundError(family, key, store)
			}
			token = maybeToken
		}
		const target = newest(store)
		const state = withdraw(token, target)
		setAtomOrSelector(state, value, target)
	}) as typeof setState,
	find: ((token, key) => findInStore(token, key, store)) as typeof findState,
	seek: ((token, key) => seekInStore(token, key, store)) as typeof seekState,
	json: (token) => getJsonToken(token, store),
})
