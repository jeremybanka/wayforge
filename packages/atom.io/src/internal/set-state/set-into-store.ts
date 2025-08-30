import type { Setter, WritableFamilyToken, WritableToken } from "atom.io"
import type { Canonical } from "atom.io/json"

import type { Store } from "../store"
import { operateOnStore, OWN_OP } from "./operate-on-store"
import type { RESET_STATE } from "./reset-in-store"

export function setIntoStore<T, TT extends T>(
	store: Store,
	token: WritableToken<T, any, any>,
	value: Setter<TT> | TT | typeof RESET_STATE,
): void

export function setIntoStore<T, TT extends T, K extends Canonical>(
	store: Store,
	token: WritableFamilyToken<T, K, any>,
	key: NoInfer<K>,
	value: Setter<TT> | TT | typeof RESET_STATE,
): void

export function setIntoStore<T, TT extends T, K extends Canonical>(
	store: Store,
	...params:
		| [
				token: WritableFamilyToken<T, K, any>,
				key: NoInfer<K>,
				value: Setter<TT> | TT | typeof RESET_STATE,
		  ]
		| [
				token: WritableToken<T, any, any>,
				value: Setter<TT> | TT | typeof RESET_STATE,
		  ]
): void

export function setIntoStore<T, TT extends T, K extends Canonical>(
	store: Store,
	...params:
		| [
				token: WritableFamilyToken<T, K, any>,
				key: NoInfer<K>,
				value: Setter<TT> | TT | typeof RESET_STATE,
		  ]
		| [
				token: WritableToken<T, any, any>,
				value: Setter<TT> | TT | typeof RESET_STATE,
		  ]
): void {
	operateOnStore(OWN_OP, store, ...params)
}
