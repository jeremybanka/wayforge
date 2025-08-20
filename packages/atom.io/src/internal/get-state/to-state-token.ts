import type { ReadableFamilyToken, ReadableToken } from "atom.io"
import { type Canonical, parseJson } from "atom.io/json"

import type { ReadableFamily } from ".."
import { seekInStore } from "../families"
import { getFamilyOfToken } from "../families/get-family-of-token"
import { mintInStore, MUST_CREATE } from "../families/mint-in-store"
import type { Store } from "../store"
import { withdraw } from "../store"

export function toStateToken<T, K extends Canonical>(
	store: Store,
	...params:
		| [token: ReadableFamilyToken<T, K>, key: K]
		| [token: ReadableToken<T>]
): {
	token: ReadableToken<T>
	family: ReadableFamily<T, K> | undefined
	subKey: K | undefined
	isNew: boolean
} {
	let existingToken: ReadableToken<T> | undefined
	let brandNewToken: ReadableToken<T> | undefined
	let familyToken: ReadableFamilyToken<T, K> | undefined
	let subKey: K | undefined
	let token: ReadableToken<T, K>
	if (params.length === 1) {
		token = params[0]
		if (`family` in token) {
			familyToken = getFamilyOfToken(store, token)
			withdraw(store, familyToken)
			subKey = parseJson(token.family.subKey)
			existingToken = seekInStore(store, familyToken, subKey)
			if (!existingToken) {
				brandNewToken = mintInStore(store, familyToken, subKey, MUST_CREATE)
				token = brandNewToken
			} else {
				token = existingToken
			}
		}
	} else {
		familyToken = params[0]
		subKey = params[1]
		existingToken = seekInStore(store, familyToken, subKey)
		if (!existingToken) {
			brandNewToken = mintInStore(store, familyToken, subKey, MUST_CREATE)
			token = brandNewToken
		} else {
			token = existingToken
		}
	}

	return {
		token,
		family: familyToken ? withdraw(store, familyToken) : undefined,
		subKey,
		isNew: Boolean(brandNewToken),
	}
}
