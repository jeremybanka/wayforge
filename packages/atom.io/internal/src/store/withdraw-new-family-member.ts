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
import { NotFoundError, newest, withdraw } from ".."

export function withdrawOrCreate<T>(
	token: RegularAtomToken<T>,
	store: Store,
): Atom<T>
export function withdrawOrCreate<T>(
	token: WritableSelectorToken<T>,
	store: Store,
): WritableSelector<T>
export function withdrawOrCreate<T>(
	token: ReadonlySelectorToken<T>,
	store: Store,
): ReadonlySelector<T>
export function withdrawOrCreate<T>(
	token: WritableToken<T>,
	store: Store,
): WritableState<T>
export function withdrawOrCreate<T>(
	token: ReadableToken<T>,
	store: Store,
): ReadableState<T>
export function withdrawOrCreate<T>(
	token: ReadableToken<T>,
	store: Store,
): ReadableState<T> {
	try {
		const state = withdraw(token, store)
		return state
	} catch (notFoundError) {
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
			throw new NotFoundError(
				{ key: token.family.key, type: `${token.type}_family` },
				store,
			)
		}
		throw notFoundError
	}
}
