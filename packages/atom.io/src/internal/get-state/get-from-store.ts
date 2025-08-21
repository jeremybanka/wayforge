import type { ReadableFamilyToken, ReadableToken } from "atom.io"
import type { Canonical } from "atom.io/json"

import { type Store, withdraw } from "../store"
import { getFallback } from "./get-fallback"
import { readOrComputeValue } from "./read-or-compute-value"
import { reduceReference } from "./reduce-reference"

export function getFromStore<T>(store: Store, token: ReadableToken<T>): T

export function getFromStore<T, K extends Canonical>(
	store: Store,
	token: ReadableFamilyToken<T, K>,
	key: K,
): T

export function getFromStore(
	store: Store,
	...params:
		| [token: ReadableFamilyToken<any, any>, key: Canonical]
		| [token: ReadableToken<any>]
): any {
	const { token, familyToken, subKey } = reduceReference(store, ...params)

	if (`counterfeit` in token && familyToken && subKey) {
	  const family = withdraw(store, familyToken)
		return getFallback(store, token, family, subKey)
	}
	const state = withdraw(store, token)

	return readOrComputeValue(store, state)
}
