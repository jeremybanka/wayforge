import type { ReadonlySelectorToken, SelectorToken } from "atom.io"
import type { Store } from "atom.io/internal"
import {
	IMPLICIT,
	createRegularAtom,
	createSelector,
	newest,
} from "atom.io/internal"

import type { WritableTokenIndex } from "."

export type SelectorTokenIndex = WritableTokenIndex<
	ReadonlySelectorToken<unknown> | SelectorToken<unknown>
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
								const set = () =>
									setSelf((state) => {
										const { key, family } = selectorToken
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
								if (newest(store).operation.open) {
									const unsubscribe = store.on.operationClose.subscribe(
										`introspection: waiting to update selector index`,
										() => {
											unsubscribe()
											set()
										},
									)
								} else {
									set()
								}
							},
						)
					},
				],
			},
			undefined,
			store,
		)
	return createSelector(
		{
			key: `👁‍🗨 Selector Token Index`,
			get: ({ get }) => get(readonlySelectorTokenIndexState__INTERNAL),
		},
		undefined,
		IMPLICIT.STORE,
	)
}
