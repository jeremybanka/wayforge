import type {
	findState,
	ReadableFamilyToken,
	ReadableToken,
	setState,
	WritableFamilyToken,
	WritableToken,
	WriterToolkit,
} from "atom.io"
import type { Canonical, Json } from "atom.io/json"

import { findInStore } from "../families"
import { readOrComputeValue } from "../get-state/read-or-compute-value"
import { newest } from "../lineage"
import { getJsonToken } from "../mutable"
import { operateOnStore } from "../set-state"
import type { Store } from "../store"
import { withdraw } from "../store"
import { updateSelectorAtoms } from "./update-selector-atoms"

export function registerSelector(
	store: Store,
	selectorType:
		| `readonly_held_selector`
		| `readonly_pure_selector`
		| `writable_held_selector`
		| `writable_pure_selector`,
	selectorKey: string,
	covered: Set<string>,
): WriterToolkit {
	return {
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
			const dependencyKey = dependency.key

			store.logger.info(
				`🔌`,
				selectorType,
				selectorKey,
				`registers dependency ( "${dependencyKey}" =`,
				dependencyValue,
				`)`,
			)

			target.selectorGraph.set(
				{
					upstreamSelectorKey: dependencyKey,
					downstreamSelectorKey: selectorKey,
				},
				{
					source: dependency.key,
				},
			)
			updateSelectorAtoms(
				store,
				selectorType,
				selectorKey,
				dependency as any,
				covered,
			)
			return dependencyValue
		},
		set: (<T, K extends Canonical, New extends T, Key extends K>(
			...params:
				| [
						token: WritableFamilyToken<T, K>,
						key: Key,
						value: New | ((oldValue: any) => New),
				  ]
				| [token: WritableToken<T>, value: New | ((oldValue: T) => New)]
		) => {
			const target = newest(store)
			operateOnStore(target, false, ...params)
		}) as typeof setState,
		find: ((...args: Parameters<typeof findState>) =>
			findInStore(store, ...args)) as typeof findState,
		json: (token) => getJsonToken(store, token),
	}
}
