import type {
	ReadableFamilyToken,
	ReadableToken,
	WritableFamilyToken,
	WritableToken,
} from "atom.io"
import type { Store } from "atom.io/internal"
import { findInStore, NotFoundError, seekInStore } from "atom.io/internal"
import type { Json } from "atom.io/json"

export function parseStateOverloads<T, K extends Json.Serializable>(
	store: Store,
	...rest: [WritableFamilyToken<T, K>, K] | [WritableToken<T>]
): WritableToken<T>

export function parseStateOverloads<T, K extends Json.Serializable>(
	store: Store,
	...rest: [ReadableFamilyToken<T, K>, K] | [ReadableToken<T>]
): ReadableToken<T>

export function parseStateOverloads<T, K extends Json.Serializable>(
	store: Store,
	...rest: [ReadableFamilyToken<T, K>, K] | [ReadableToken<T>]
): ReadableToken<T> {
	let token: ReadableToken<any>
	if (rest.length === 2) {
		const family = rest[0]
		const key = rest[1]

		if (store.config.lifespan === `immortal`) {
			const maybeToken = seekInStore(family, key, store)
			if (!maybeToken) {
				throw new NotFoundError(family, key, store)
			}
			token = maybeToken
		} else {
			token = findInStore(family, key, store)
		}
	} else {
		token = rest[0]
	}
	return token
}
