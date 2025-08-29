import type { AtomToken, SelectorToken } from "atom.io"
import type { Store } from "atom.io/internal"
import {
	createRegularAtom,
	deposit,
	isReservedIntrospectionKey,
} from "atom.io/internal"

import type { WritableTokenIndex } from "."

export type SelectorTokenIndex = WritableTokenIndex<
	SelectorToken<unknown, any, any>
>

export const attachSelectorIndex = (
	store: Store,
): AtomToken<SelectorTokenIndex> => {
	return createRegularAtom<SelectorTokenIndex, never, never>(
		store,
		{
			key: `🔍 Selector Token Index`,
			default: () => {
				const base: SelectorTokenIndex = new Map()
				for (const map of [store.readonlySelectors, store.writableSelectors]) {
					for (const [key, val] of map) {
						if (isReservedIntrospectionKey(key)) {
							continue
						}
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
				return base
			},
			effects: [
				({ setSelf }) => {
					store.on.selectorCreation.subscribe(
						`introspection`,
						(selectorToken) => {
							if (isReservedIntrospectionKey(selectorToken.key)) {
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
								return new Map(self)
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
								return new Map(self)
							})
						},
					)
				},
			],
		},
		undefined,
	)
}
