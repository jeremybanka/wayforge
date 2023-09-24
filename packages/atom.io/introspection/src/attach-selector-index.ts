import { __INTERNAL__ } from "atom.io"
import type { ReadonlySelectorToken, SelectorToken } from "atom.io"

import type { StateTokenIndex } from "."
import { target } from "../../internal/src"

export type SelectorTokenIndex = StateTokenIndex<
	ReadonlySelectorToken<unknown> | SelectorToken<unknown>
>

export const attachSelectorIndex = (
	store: __INTERNAL__.Store = __INTERNAL__.IMPLICIT.STORE,
): ReadonlySelectorToken<SelectorTokenIndex> => {
	const readonlySelectorTokenIndexState__INTERNAL =
		__INTERNAL__.createAtom<SelectorTokenIndex>(
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
						store.subject.selectorCreation.subscribe(
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
								if (target(store).operation.open) {
									const unsubscribe = store.subject.operationStatus.subscribe(
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
	return __INTERNAL__.createSelector({
		key: `👁‍🗨 Selector Token Index`,
		get: ({ get }) => get(readonlySelectorTokenIndexState__INTERNAL),
	})
}
