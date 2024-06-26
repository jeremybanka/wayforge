import type { AtomToken, ReadonlySelectorToken } from "atom.io"
import type { Store } from "atom.io/internal"
import {
	createRegularAtom,
	createStandaloneSelector,
	deposit,
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
					store.on.atomCreation.subscribe(`introspection`, (atomToken) => {
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
					})
					store.on.atomDisposal.subscribe(`introspection`, (atomToken) => {
						setSelf((self) => {
							if (atomToken.family) {
								const { key: familyKey, subKey } = atomToken.family
								const familyNode = self.get(familyKey)
								if (familyNode && `familyMembers` in familyNode) {
									familyNode.familyMembers.delete(subKey)
									if (familyNode.familyMembers.size === 0) {
										self.delete(familyKey)
									}
								}
							} else {
								self.delete(atomToken.key)
							}
							return self
						})
					})
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
