import type { AtomToken, ReadonlySelectorToken } from "atom.io"
import type { Store } from "atom.io/internal"
import {
	IMPLICIT,
	createRegularAtom,
	createSelector,
	newest,
} from "atom.io/internal"

import type { StateTokenIndex } from "."

export type AtomTokenIndex = StateTokenIndex<AtomToken<unknown>>

export const attachAtomIndex = (
	store: Store = IMPLICIT.STORE,
): ReadonlySelectorToken<AtomTokenIndex> => {
	const atomTokenIndexState__INTERNAL = createRegularAtom<AtomTokenIndex>(
		{
			key: `👁‍🗨 Atom Token Index (Internal)`,
			default: () => {
				const defaultAtomIndex = [...store.atoms]
					.filter(([key]) => !key.includes(`👁‍🗨`))
					.reduce<AtomTokenIndex>((acc, [key]) => {
						acc[key] = { key, type: `atom` }
						return acc
					}, {})
				return defaultAtomIndex
			},
			effects: [
				({ setSelf }) => {
					store.subject.atomCreation.subscribe(`introspection`, (atomToken) => {
						if (atomToken.key.includes(`👁‍🗨`)) {
							return
						}
						const set = () =>
							setSelf((state) => {
								const { key, family } = atomToken
								if (family) {
									const { key: familyKey, subKey } = family
									const current = state[familyKey]
									if (current === undefined || `familyMembers` in current) {
										const familyKeyState = current || {
											key: familyKey,
											familyMembers: {},
										}
										return {
											...state,
											[familyKey]: {
												...familyKeyState,
												familyMembers: {
													...familyKeyState.familyMembers,
													[subKey]: atomToken,
												},
											},
										}
									}
								}
								return {
									...state,
									[key]: atomToken,
								}
							})
						if (newest(store).operation.open) {
							const unsubscribe = store.subject.operationStatus.subscribe(
								`introspection: waiting to update atom index`,
								() => {
									unsubscribe()
									set()
								},
							)
						} else {
							set()
						}
					})
				},
			],
		},
		undefined,
		store,
	)
	return createSelector(
		{
			key: `👁‍🗨 Atom Token Index`,
			get: ({ get }) => get(atomTokenIndexState__INTERNAL),
		},
		undefined,
		store,
	)
}
