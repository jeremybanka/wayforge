import type { WritableFamilyToken, WritableToken } from "atom.io"
import type { Canonical } from "atom.io/json"

import type { Store } from "../store"
import { operateOnStore } from "./operate-on-store"
import type { RESET_STATE } from "./reset-in-store"

export function setIntoStore<T, New extends T>(
	store: Store,
	token: WritableToken<T>,
	value: New | typeof RESET_STATE | ((oldValue: T) => New),
): void

export function setIntoStore<
	T,
	K extends Canonical,
	New extends T,
	Key extends K,
>(
	store: Store,
	token: WritableFamilyToken<T, K>,
	key: Key,
	value: New | typeof RESET_STATE | ((oldValue: T) => New),
): void

export function setIntoStore<T, New extends T>(
	store: Store,
	...params:
		| [
				token: WritableFamilyToken<T, Canonical>,
				key: Canonical,
				value: New | typeof RESET_STATE | ((oldValue: T) => New),
		  ]
		| [
				token: WritableToken<T>,
				value: New | typeof RESET_STATE | ((oldValue: T) => New),
		  ]
): void {
	operateOnStore(store, true, ...params)
}
