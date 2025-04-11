import type {
	findState,
	ReadableFamilyToken,
	ReadableToken,
	setState,
	SetterToolkit,
	WritableFamilyToken,
	WritableToken,
} from "atom.io"
import type { Json } from "atom.io/json"

import { findInStore } from "../families"
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
): SetterToolkit => ({
	get: (
		...params:
			| [ReadableFamilyToken<any, any>, Json.Serializable]
			| [ReadableToken<any>]
	) => {
		const target = newest(store)
		let dependency: ReadableToken<any>

		if (params.length === 2) {
			const [family, key] = params
			dependency = findInStore(store, family, key)
		} else {
			;[dependency] = params
		}

		const dependencyState = withdraw(store, dependency)
		const dependencyValue = readOrComputeValue(store, dependencyState)

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
					token: WritableFamilyToken<T, any>,
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
			token = findInStore(store, family, key)
		}
		const target = newest(store)
		const state = withdraw(target, token)
		setAtomOrSelector(target, state, value)
	}) as typeof setState,
	find: ((...args: Parameters<typeof findState>) =>
		findInStore(store, ...args)) as typeof findState,
	json: (token) => getJsonToken(store, token),
})
