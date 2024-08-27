import type { ReadonlySelectorToken, SelectorToken } from "atom.io"
import type { Store } from "atom.io/internal"
import {
	createRegularAtom,
	createStandaloneSelector,
	deposit,
	IMPLICIT,
} from "atom.io/internal"

import type { WritableTokenIndex } from "."

export type SelectorTokenIndex = WritableTokenIndex<SelectorToken<unknown>>

export const attachSelectorIndex = (
	store: Store = IMPLICIT.STORE,
): ReadonlySelectorToken<SelectorTokenIndex> => {
	const readonlySelectorTokenIndexState__INTERNAL =
		createRegularAtom<SelectorTokenIndex>(
			store,

			{
				key: `🔍 Selector Token Index (Internal)`,
				default: () => {
					const base: SelectorTokenIndex = new Map()
					for (const map of [store.readonlySelectors, store.selectors]) {
						for (const [key, val] of map) {
							if (!key.includes(`🔍`)) {
								const token = deposit(val)
								if (val.family) {
									let familyNode = base.get(val.family.key)
									if (!familyNode || !(`familyMembers` in familyNode)) {
										familyNode = {
											key: val.family.key,
											familyMembers: new Map(),
										}
										base.set(val.family.key, familyNode)
									}
									familyNode.familyMembers.set(val.family.subKey, token)
								} else {
									base.set(key, token)
								}
							}
						}
					}
					return base
				},
				effects: [
					({ setSelf }) => {
						store.on.selectorCreation.subscribe(
							`introspection`,
							(selectorToken) => {
								if (selectorToken.key.includes(`🔍`)) {
									return
								}

								setSelf((self) => {
									if (selectorToken.family) {
										const { key: familyKey, subKey } = selectorToken.family
										let familyNode = self.get(familyKey)
										if (
											familyNode === undefined ||
											!(`familyMembers` in familyNode)
										) {
											familyNode = {
												key: familyKey,
												familyMembers: new Map(),
											}
											self.set(familyKey, familyNode)
										}
										familyNode.familyMembers.set(subKey, selectorToken)
									} else {
										self.set(selectorToken.key, selectorToken)
									}
									return self
								})
							},
						)

						store.on.selectorDisposal.subscribe(
							`introspection`,
							(selectorToken) => {
								setSelf((self) => {
									if (selectorToken.family) {
										const { key: familyKey, subKey } = selectorToken.family
										const familyNode = self.get(familyKey)
										if (familyNode && `familyMembers` in familyNode) {
											familyNode.familyMembers.delete(subKey)
											if (familyNode.familyMembers.size === 0) {
												self.delete(familyKey)
											}
										}
									} else {
										self.delete(selectorToken.key)
									}
									return self
								})
							},
						)
					},
				],
			},
			undefined,
		)
	return createStandaloneSelector(store, {
		key: `🔍 Selector Token Index`,
		get: ({ get }) => get(readonlySelectorTokenIndexState__INTERNAL),
	})
}
