import type { ReadableFamilyToken, ReadableToken, ViewOf } from "atom.io"
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
): ViewOf<T>

export function getFromStore<T, K extends Canonical, Key extends K>(
	store: Store,
	...params:
		| [token: ReadableFamilyToken<T, K>, key: Key]
		| [token: ReadableToken<T>]
): ViewOf<T>

export function getFromStore<T, K extends Canonical, Key extends K>(
	store: Store,
	...params:
		| [token: ReadableFamilyToken<T, K>, key: Key]
		| [token: ReadableToken<T>]
): ViewOf<T> {
	const { token, family, subKey } = reduceReference(store, ...params)

	if (`counterfeit` in token && family && subKey) {
		return getFallback(store, token, family, subKey)
	}
	const state = withdraw(store, token)

	return readOrComputeValue(store, state)
}
