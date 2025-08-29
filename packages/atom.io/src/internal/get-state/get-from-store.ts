import type { ReadableFamilyToken, ReadableToken, ViewOf } from "atom.io"
import type { Canonical } from "atom.io/json"

import { type Store, withdraw } from "../store"
import { getFallback } from "./get-fallback"
import { readOrComputeValue } from "./read-or-compute-value"
import { reduceReference } from "./reduce-reference"

export function getFromStore<T>(store: Store, token: ReadableToken<T>): T

export function getFromStore<T, E>(
	store: Store,
	token: ReadableToken<T, any, E>,
): E | T

export function getFromStore<T, K extends Canonical, E>(
	store: Store,
	token: ReadableFamilyToken<T, K, E>,
	key: K,
): ViewOf<E | T>

export function getFromStore<T, K extends Canonical, Key extends K, E>(
	store: Store,
	...params:
		| [token: ReadableFamilyToken<T, K, E>, key: Key]
		| [token: ReadableToken<T, any, E>]
): ViewOf<E | T>

export function getFromStore<T, K extends Canonical, Key extends K, E>(
	store: Store,
	...params:
		| [token: ReadableFamilyToken<T, K, E>, key: Key]
		| [token: ReadableToken<T, any, E>]
): ViewOf<E | T> {
	const { token, family, subKey } = reduceReference(store, ...params)

	if (`counterfeit` in token && family && subKey) {
		return getFallback(store, token, family, subKey)
	}
	const state = withdraw(store, token)

	return readOrComputeValue(store, state)
}
