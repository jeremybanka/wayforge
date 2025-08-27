import type { WritableFamilyToken, WritableToken } from "atom.io"
import type { Canonical } from "atom.io/json"

import type { Store } from "../store"
import { setIntoStore } from "./set-into-store"

export const RESET_STATE: unique symbol = Symbol(`RESET`)

export function resetInStore(store: Store, token: WritableToken<any>): void

export function resetInStore<K extends Canonical>(
	store: Store,
	token: WritableFamilyToken<any, K>,
	key: K,
): void

export function resetInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	...params:
		| [token: WritableFamilyToken<T, K>, key: Key]
		| [token: WritableToken<T>]
): void

export function resetInStore<T, K extends Canonical, Key extends K>(
	store: Store,
	...params:
		| [token: WritableFamilyToken<T, K>, key: Key]
		| [token: WritableToken<T>]
): void {
	let token: WritableToken<T>
	let family: WritableFamilyToken<T, Canonical> | null
	let key: Canonical | null
	if (params.length === 1) {
		token = params[0]
		setIntoStore(store, token, RESET_STATE)
	} else {
		family = params[0]
		key = params[1]
		setIntoStore(store, family, key, RESET_STATE)
	}
}
