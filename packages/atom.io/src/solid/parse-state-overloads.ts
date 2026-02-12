import type {
	ReadableFamilyToken,
	ReadableToken,
	WritableFamilyToken,
	WritableToken,
} from "atom.io"
import type { Store } from "atom.io/internal"
import { findInStore } from "atom.io/internal"
import type { Canonical } from "atom.io/json"

export function parseStateOverloads<T, K extends Canonical, Key extends K, E>(
	store: Store,
	...rest: [WritableFamilyToken<T, K, E>, Key] | [WritableToken<T, any, E>]
): WritableToken<T, Key, E>

export function parseStateOverloads<T, K extends Canonical, Key extends K, E>(
	store: Store,
	...rest: [ReadableFamilyToken<T, K, E>, Key] | [ReadableToken<T, any, E>]
): ReadableToken<T, Key, E>

export function parseStateOverloads<T, K extends Canonical, Key extends K, E>(
	store: Store,
	...rest: [ReadableFamilyToken<T, K, E>, Key] | [ReadableToken<T, any, E>]
): ReadableToken<T, Key, E> {
	let token: ReadableToken<any, any, any>
	if (rest.length === 2) {
		const family = rest[0]
		const key = rest[1]

		token = findInStore(store, family, key)
	} else {
		token = rest[0]
	}
	return token
}
