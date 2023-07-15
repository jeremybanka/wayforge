import type { AtomToken, ReadonlySelectorToken, SelectorToken } from "../.."
import { selector, atom } from "../.."
import type { Store } from "../../internal/store"
import { IMPLICIT } from "../../internal/store"

export type StateTokenIndex<
	Token extends
		| AtomToken<unknown>
		| ReadonlySelectorToken<unknown>
		| SelectorToken<unknown>,
> = Record<
	string,
	| Token
	| {
			key: string
			familyMembers: Record<string, Token>
	  }
>

export type AtomTokenIndex = StateTokenIndex<AtomToken<unknown>>
export type SelectorTokenIndex = StateTokenIndex<
	ReadonlySelectorToken<unknown> | SelectorToken<unknown>
>

export const attachMetaAtoms = (
	store: Store = IMPLICIT.STORE,
): ReadonlySelectorToken<AtomTokenIndex> => {
	const atomTokenIndexState__INTERNAL = atom<AtomTokenIndex>({
		key: `👁‍🗨_atom_token_index__INTERNAL`,
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
	})
	return selector({
		key: `👁‍🗨_atom_token_index`,
		get: ({ get }) => get(atomTokenIndexState__INTERNAL),
	})
}

export const attachMetaSelectors = (
	store: Store = IMPLICIT.STORE,
): ReadonlySelectorToken<SelectorTokenIndex> => {
	const readonlySelectorTokenIndexState__INTERNAL = atom<SelectorTokenIndex>({
		key: `👁‍🗨_selector_token_index__INTERNAL`,
		default: () =>
			Object.assign(
				[...store.readonlySelectors].reduce<SelectorTokenIndex>((acc, [key]) => {
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
				store.subject.selectorCreation.subscribe((selectorToken) => {
					if (store.operation.open) {
						return
					}
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
				})
			},
		],
	})
	return selector({
		key: `👁‍🗨_selector_token_index`,
		get: ({ get }) => get(readonlySelectorTokenIndexState__INTERNAL),
	})
}
