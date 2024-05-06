import type { ReadonlySelectorToken, SelectorToken } from "atom.io"
import type { Store } from "atom.io/internal"
import {
	createRegularAtom,
	createStandaloneSelector,
	IMPLICIT,
} from "atom.io/internal"

import type { WritableTokenIndex } from "."

export type SelectorTokenIndex = WritableTokenIndex<SelectorToken<unknown>>

export const attachSelectorIndex = (
	store: Store = IMPLICIT.STORE,
): ReadonlySelectorToken<SelectorTokenIndex> => {
	const readonlySelectorTokenIndexState__INTERNAL =
		createRegularAtom<SelectorTokenIndex>(
			{
				key: `👁‍🗨 Selector Token Index (Internal)`,
				default: () => {
					const base: SelectorTokenIndex = new Map()
					for (const map of [store.readonlySelectors, store.selectors]) {
						for (const [key, val] of map) {
							if (!key.includes(`👁‍🗨`)) {
								if (val.family) {
									let familyNode = base.get(val.family.key)
									if (!familyNode || !(`familyMembers` in familyNode)) {
										familyNode = {
											key: val.family.key,
											familyMembers: new Map(),
										}
										base.set(val.family.key, familyNode)
									}
									familyNode.familyMembers.set(key, val)
								} else {
									base.set(key, val)
								}
							}
						}
					}
					return base
				},
				effects: [
					({ setSelf }) => {
						const unsubscribeFromSelectorCreation =
							store.on.selectorCreation.subscribe(
								`introspection`,
								(selectorToken) => {
									if (selectorToken.key.includes(`👁‍🗨`)) {
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
						const unsubscribeFromSelectorDisposal =
							store.on.selectorDisposal.subscribe(
								`introspection`,
								(selectorToken) => {},
							)
						return () => {
							unsubscribeFromSelectorCreation()
							unsubscribeFromSelectorDisposal()
						}
					},
				],
			},
			undefined,
			store,
		)
	return createStandaloneSelector(
		{
			key: `👁‍🗨 Selector Token Index`,
			get: ({ get }) => get(readonlySelectorTokenIndexState__INTERNAL),
		},
		IMPLICIT.STORE,
	)
}
