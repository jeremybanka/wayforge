import type { WritableFamilyToken, WritableToken } from "atom.io"
import type { Canonical } from "atom.io/json"

import type { Store } from "../store"
import { operateOnStore, OWN_OP } from "./operate-on-store"
import type { RESET_STATE } from "./reset-in-store"

export function setIntoStore<T, New extends T, E>(
	store: Store,
	token: WritableToken<T, any, E>,
	value: New | typeof RESET_STATE | ((oldValue: T) => New),
): void

export function setIntoStore<
	T,
	K extends Canonical,
	New extends T,
	Key extends K,
	E,
>(
	store: Store,
	token: WritableFamilyToken<T, K, E>,
	key: Key,
	value: New | typeof RESET_STATE | ((oldValue: T) => New),
): void

export function setIntoStore<
	T,
	K extends Canonical,
	New extends T,
	Key extends K,
	E,
>(
	store: Store,
	...params:
		| [
				token: WritableFamilyToken<T, K, E>,
				key: Key,
				value: New | typeof RESET_STATE | ((oldValue: T) => New),
		  ]
		| [
				token: WritableToken<T, any, E>,
				value: New | typeof RESET_STATE | ((oldValue: T) => New),
		  ]
): void

export function setIntoStore<
	T,
	K extends Canonical,
	New extends T,
	Key extends K,
	E,
>(
	store: Store,
	...params:
		| [
				token: WritableFamilyToken<T, K, E>,
				key: Key,
				value: New | typeof RESET_STATE | ((oldValue: T) => New),
		  ]
		| [
				token: WritableToken<T, any, E>,
				value: New | typeof RESET_STATE | ((oldValue: T) => New),
		  ]
): void {
	operateOnStore(store, OWN_OP, ...params)
}
