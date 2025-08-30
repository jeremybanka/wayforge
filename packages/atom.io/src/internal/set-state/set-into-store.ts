import type { WritableFamilyToken, WritableToken } from "atom.io"
import type { Canonical } from "atom.io/json"

import type { Store } from "../store"
import { operateOnStore, OWN_OP } from "./operate-on-store"
import type { RESET_STATE } from "./reset-in-store"

export function setIntoStore<T, E>(
	store: Store,
	token: WritableToken<T, any, E>,
	value: NoInfer<T> | typeof RESET_STATE | ((oldValue: T) => NoInfer<T>),
): void

export function setIntoStore<T, K extends Canonical, E>(
	store: Store,
	token: WritableFamilyToken<T, K, E>,
	key: NoInfer<K>,
	value: NoInfer<T> | typeof RESET_STATE | ((oldValue: T) => NoInfer<T>),
): void

export function setIntoStore<T, K extends Canonical, E>(
	store: Store,
	...params:
		| [
				token: WritableFamilyToken<T, K, E>,
				key: NoInfer<K>,
				value: NoInfer<T> | typeof RESET_STATE | ((oldValue: T) => NoInfer<T>),
		  ]
		| [
				token: WritableToken<T, any, E>,
				value: NoInfer<T> | typeof RESET_STATE | ((oldValue: T) => NoInfer<T>),
		  ]
): void

export function setIntoStore<T, K extends Canonical, E>(
	store: Store,
	...params:
		| [
				token: WritableFamilyToken<T, K, E>,
				key: NoInfer<K>,
				value: NoInfer<T> | typeof RESET_STATE | ((oldValue: T) => NoInfer<T>),
		  ]
		| [
				token: WritableToken<T, any, E>,
				value: NoInfer<T> | typeof RESET_STATE | ((oldValue: T) => NoInfer<T>),
		  ]
): void {
	operateOnStore(store, OWN_OP, ...params)
}
