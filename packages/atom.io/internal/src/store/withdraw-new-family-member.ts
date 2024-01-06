import type {
	AtomToken,
	ReadableToken,
	ReadonlySelectorToken,
	SelectorToken,
	WritableToken,
} from "atom.io"
import type { Atom, ReadonlySelector, Selector, StateNode, Store } from ".."
import { newest, withdraw } from ".."

export function withdrawNewFamilyMember<T>(
	token: AtomToken<T>,
	store: Store,
): Atom<T> | undefined
export function withdrawNewFamilyMember<T>(
	token: SelectorToken<T>,
	store: Store,
): Selector<T> | undefined
export function withdrawNewFamilyMember<T>(
	token: ReadonlySelectorToken<T>,
	store: Store,
): ReadonlySelector<T> | undefined
export function withdrawNewFamilyMember<T>(
	token: WritableToken<T>,
	store: Store,
): Atom<T> | Selector<T> | undefined
export function withdrawNewFamilyMember<T>(
	token: ReadableToken<T>,
	store: Store,
): StateNode<T> | undefined
export function withdrawNewFamilyMember<T>(
	token: ReadableToken<T>,
	store: Store,
): StateNode<T> | undefined {
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
