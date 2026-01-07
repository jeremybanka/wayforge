import type {
	editRelations,
	findRelations,
	findState,
	getInternalRelations,
	ReadableFamilyToken,
	ReadableToken,
	setState,
	WritableFamilyToken,
	WritableToken,
	WriterToolkit,
} from "atom.io"
import type { Canonical } from "atom.io/json"

import { findInStore } from "../families"
import { getFallback } from "../get-state/get-fallback"
import { readOrComputeValue } from "../get-state/read-or-compute-value"
import { reduceReference } from "../get-state/reduce-reference"
import {
	editRelationsInStore,
	findRelationsInStore,
	getInternalRelationsFromStore,
} from "../join"
import { newest } from "../lineage"
import { getJsonToken } from "../mutable"
import { JOIN_OP, operateOnStore } from "../set-state/operate-on-store"
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
				| [ReadableFamilyToken<any, any, any>, Canonical]
				| [ReadableToken<any, any, any>]
		) => {
			const target = newest(store)
			const { token, family, subKey } = reduceReference(store, ...params)
			let dependencyValue: unknown
			if (`counterfeit` in token && family && subKey) {
				dependencyValue = getFallback(store, token, family, subKey)
			} else {
				const dependency = withdraw(store, token)
				dependencyValue = readOrComputeValue(store, dependency)
			}

			store.logger.info(
				`🔌`,
				selectorType,
				selectorKey,
				`registers dependency ( "${token.key}" =`,
				dependencyValue,
				`)`,
			)

			target.selectorGraph.set(
				{
					upstreamSelectorKey: token.key,
					downstreamSelectorKey: selectorKey,
				},
				{
					source: token.key,
				},
			)
			updateSelectorAtoms(store, selectorType, selectorKey, token, covered)
			return dependencyValue
		},
		set: (<T, K extends Canonical>(
			...params:
				| [
						token: WritableFamilyToken<T, K>,
						key: NoInfer<K>,
						value: NoInfer<T> | ((oldValue: T) => NoInfer<T>),
				  ]
				| [
						token: WritableToken<T>,
						value: NoInfer<T> | ((oldValue: T) => NoInfer<T>),
				  ]
		) => {
			const target = newest(store)
			operateOnStore(JOIN_OP, target, ...params)
		}) as typeof setState,
		find: ((...args: Parameters<typeof findState>) =>
			findInStore(store, ...args)) as typeof findState,
		json: (token) => getJsonToken(store, token),
		rel: {
			edit: ((...ps: Parameters<typeof editRelations>) => {
				editRelationsInStore(store, ...ps)
			}) as typeof editRelations,
			find: ((...ps: Parameters<typeof findRelations>) =>
				findRelationsInStore(store, ...ps)) as typeof findRelations,
			internal: ((...ps: Parameters<typeof getInternalRelations>) =>
				getInternalRelationsFromStore(
					store,
					...ps,
				)) as typeof getInternalRelations,
		},
	}
}
