import type {
	ReadableToken,
	ReadonlySelectorToken,
	RegularAtomToken,
	WritableSelectorToken,
	WritableToken,
} from "atom.io"
import type {
	Atom,
	ReadableState,
	ReadonlySelector,
	Store,
	WritableSelector,
	WritableState,
} from ".."
import { newest, withdraw } from ".."

export function withdrawNewFamilyMember<T>(
	token: RegularAtomToken<T>,
	store: Store,
): Atom<T> | undefined
export function withdrawNewFamilyMember<T>(
	token: WritableSelectorToken<T>,
	store: Store,
): WritableSelector<T> | undefined
export function withdrawNewFamilyMember<T>(
	token: ReadonlySelectorToken<T>,
	store: Store,
): ReadonlySelector<T> | undefined
export function withdrawNewFamilyMember<T>(
	token: WritableToken<T>,
	store: Store,
): WritableState<T> | undefined
export function withdrawNewFamilyMember<T>(
	token: ReadableToken<T>,
	store: Store,
): ReadableState<T> | undefined
export function withdrawNewFamilyMember<T>(
	token: ReadableToken<T>,
	store: Store,
): ReadableState<T> | undefined {
	if (token.family) {
		store.logger.info(
			`👪`,
			token.type,
			token.key,
			`creating new family member in store "${store.config.name}"`,
		)
		const target = newest(store)
		const family = target.families.get(token.family.key)
		if (family) {
			const jsonSubKey = JSON.parse(token.family.subKey)
			family(jsonSubKey)
			const state = withdraw(token, store)
			return state
		}
	}
	return undefined
}
