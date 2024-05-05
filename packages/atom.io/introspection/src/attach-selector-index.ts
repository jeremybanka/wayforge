import type { ReadonlySelectorToken, WritableSelectorToken } from "atom.io"
import type { Store } from "atom.io/internal"
import {
	createRegularAtom,
	createStandaloneSelector,
	IMPLICIT,
	newest,
} from "atom.io/internal"

import type { WritableTokenIndex } from "."

export type SelectorTokenIndex = WritableTokenIndex<
	ReadonlySelectorToken<unknown> | WritableSelectorToken<unknown>
>

export const attachSelectorIndex = (
	store: Store = IMPLICIT.STORE,
): ReadonlySelectorToken<SelectorTokenIndex> => {
	const readonlySelectorTokenIndexState__INTERNAL =
		createRegularAtom<SelectorTokenIndex>(
			{
				key: `👁‍🗨 Selector Token Index (Internal)`,
				default: () =>
					Object.assign(
						[...store.readonlySelectors]
							.filter(([key]) => !key.includes(`👁‍🗨`))
							.reduce<SelectorTokenIndex>((acc, [key]) => {
								acc[key] = { key, type: `readonly_selector` }
								return acc
							}, {}),
						[...store.selectors].reduce<SelectorTokenIndex>((acc, [key]) => {
							acc[key] = { key, type: `selector` }
							return acc
						}, {}),
					),
				effects: [
					({ setSelf }) => {
						store.on.selectorCreation.subscribe(
							`introspection`,
							(selectorToken) => {
								if (selectorToken.key.includes(`👁‍🗨`)) {
									return
								}

								setSelf((state) => {
									const { key, family } = selectorToken
									if (family) {
										const { key: familyKey, subKey } = family
										const current = state[familyKey]
										if (current === undefined || `familyMembers` in current) {
											const familyKeyState = current ?? {
												key: familyKey,
												familyMembers: {},
											}
											return {
												...state,
												[familyKey]: {
													...familyKeyState,
													familyMembers: {
														...familyKeyState.familyMembers,
														[subKey]: selectorToken,
													},
												},
											}
										}
									}
									return {
										...state,
										[key]: selectorToken,
									}
								})
							},
						)
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
