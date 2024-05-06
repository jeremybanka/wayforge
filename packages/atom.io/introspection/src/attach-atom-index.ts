import type { AtomToken, ReadonlySelectorToken } from "atom.io"
import type { Store } from "atom.io/internal"
import {
	createRegularAtom,
	createStandaloneSelector,
	IMPLICIT,
} from "atom.io/internal"

import type { WritableTokenIndex } from "."

export type AtomTokenIndex = WritableTokenIndex<AtomToken<unknown>>

export const attachAtomIndex = (
	store: Store = IMPLICIT.STORE,
): ReadonlySelectorToken<AtomTokenIndex> => {
	const atomTokenIndexState__INTERNAL = createRegularAtom<AtomTokenIndex>(
		{
			key: `👁‍🗨 Atom Token Index (Internal)`,
			default: () => {
				const base: AtomTokenIndex = new Map()
				for (const [key, val] of store.atoms) {
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
				return base
			},
			effects: [
				({ setSelf }) => {
					const unsubscribeFromAtomCreation = store.on.atomCreation.subscribe(
						`introspection`,
						(atomToken) => {
							if (atomToken.key.includes(`👁‍🗨`)) {
								return
							}

							setSelf((self) => {
								if (atomToken.family) {
									const { key: familyKey, subKey } = atomToken.family
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
									familyNode.familyMembers.set(subKey, atomToken)
								} else {
									self.set(atomToken.key, atomToken)
								}
								return self
							})
						},
					)
					const unsubscribeFromAtomDisposal = store.on.atomDisposal.subscribe(
						`introspection`,
						(atomToken) => {},
					)
					return () => {
						unsubscribeFromAtomCreation()
						unsubscribeFromAtomDisposal()
					}
				},
			],
		},
		undefined,
		store,
	)
	return createStandaloneSelector(
		{
			key: `👁‍🗨 Atom Token Index`,
			get: ({ get }) => get(atomTokenIndexState__INTERNAL),
		},
		store,
	)
}
