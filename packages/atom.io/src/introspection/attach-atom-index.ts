import type { AtomToken, ReadonlySelectorToken } from "atom.io"
import { __INTERNAL__ } from "atom.io"

import type { StateTokenIndex } from "."

export type AtomTokenIndex = StateTokenIndex<AtomToken<unknown>>

export const attachAtomIndex = (
	store: __INTERNAL__.Store = __INTERNAL__.IMPLICIT.STORE,
): ReadonlySelectorToken<AtomTokenIndex> => {
	const atomTokenIndexState__INTERNAL =
		__INTERNAL__.atom__INTERNAL<AtomTokenIndex>(
			{
				key: `👁‍🗨 Atom Token Index (Internal)`,
				default: () =>
					[...store.atoms].reduce<AtomTokenIndex>((acc, [key]) => {
						acc[key] = { key, type: `atom` }
						return acc
					}, {}),
				effects: [
					({ setSelf }) => {
						store.subject.atomCreation.subscribe((atomToken) => {
							if (store.operation.open) {
								return
							}
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
						})
					},
				],
			},
			undefined,
			store,
		)
	return __INTERNAL__.selector__INTERNAL(
		{
			key: `👁‍🗨 Atom Token Index`,
			get: ({ get }) => get(atomTokenIndexState__INTERNAL),
		},
		undefined,
		store,
	)
}
