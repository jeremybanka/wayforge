import type {
	AtomToken,
	ReadonlySelectorToken,
	SelectorToken,
	StateToken,
} from "atom.io"
import type { Atom, ReadonlySelector, Selector, Store } from ".."
import { withdraw } from ".."
import { target } from "../transaction"

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
	token: StateToken<T>,
	store: Store,
): Atom<T> | Selector<T> | undefined
export function withdrawNewFamilyMember<T>(
	token: ReadonlySelectorToken<T> | StateToken<T>,
	store: Store,
): Atom<T> | ReadonlySelector<T> | Selector<T> | undefined
export function withdrawNewFamilyMember<T>(
	token:
		| AtomToken<T>
		| ReadonlySelectorToken<T>
		| SelectorToken<T>
		| StateToken<T>,
	store: Store,
): Atom<T> | ReadonlySelector<T> | Selector<T> | undefined {
	if (token.family) {
		store.logger.info(
			`👪`,
			token.type,
			token.key,
			`creating new family member in store "${store.config.name}"`,
		)
		const core = target(store)
		const family = core.families.get(token.family.key)
		if (family) {
			const jsonSubKey = JSON.parse(token.family.subKey)
			family(jsonSubKey)
			const state = withdraw(token, store)
			return state
		}
	}
	return undefined
}
