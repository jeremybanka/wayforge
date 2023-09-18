import type {
	AtomToken,
	ReadonlySelectorToken,
	SelectorToken,
	StateToken,
	Store,
} from "atom.io"
import type { Atom, ReadonlySelector, Selector } from ".."
import { withdraw } from ".."
import { target } from "../transaction"

export function withdrawNewFamilyMember<T>(
	token: AtomToken<T>,
	store: Store,
): Atom<T> | null
export function withdrawNewFamilyMember<T>(
	token: SelectorToken<T>,
	store: Store,
): Selector<T> | null
export function withdrawNewFamilyMember<T>(
	token: ReadonlySelectorToken<T>,
	store: Store,
): ReadonlySelector<T> | null
export function withdrawNewFamilyMember<T>(
	token: StateToken<T>,
	store: Store,
): Atom<T> | Selector<T> | null
export function withdrawNewFamilyMember<T>(
	token: ReadonlySelectorToken<T> | StateToken<T>,
	store: Store,
): Atom<T> | ReadonlySelector<T> | Selector<T> | null
export function withdrawNewFamilyMember<T>(
	token:
		| AtomToken<T>
		| ReadonlySelectorToken<T>
		| SelectorToken<T>
		| StateToken<T>,
	store: Store,
): Atom<T> | ReadonlySelector<T> | Selector<T> | null {
	store.config.logger?.info(
		`👪 creating new family member "${token.key}" in store "${store.config.name}"`,
	)
	if (token.family) {
		const core = target(store)
		const family = core.families.get(token.family.key)
		if (family) {
			const jsonSubKey = JSON.parse(token.family.subKey)
			family(jsonSubKey)
			const state = withdraw(token, store)
			return state
		}
	}
	return null
}
