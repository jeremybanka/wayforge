import type { ReadableFamilyToken, ReadableToken } from "atom.io"
import type { Canonical } from "atom.io/json"

import { disposeAtom } from "../atom"
import { disposeSelector } from "../selector"
import { type Store, withdraw } from "../store"
import { findInStore } from "./find-in-store"

export function disposeFromStore(store: Store, token: ReadableToken<any>): void

export function disposeFromStore<K extends Canonical>(
	store: Store,
	token: ReadableFamilyToken<any, K>,
	key: K,
): void

export function disposeFromStore(
	store: Store,
	...params:
		| [token: ReadableFamilyToken<any, any>, key: Canonical]
		| [token: ReadableToken<any>]
): void {
	let token: ReadableToken<any>
	if (params.length === 1) {
		token = params[0]
	} else {
		const family = params[0]
		const key = params[1]
		const maybeToken = findInStore(store, family, key)
		token = maybeToken
	}
	try {
		withdraw(store, token)
	} catch (_) {
		store.logger.error(
			`❌`,
			token.type,
			token.key,
			`could not be disposed because it was not found in the store "${store.config.name}".`,
		)
		return
	}
	switch (token.type) {
		case `atom`:
		case `mutable_atom`:
			disposeAtom(store, token)
			break
		case `writable_pure_selector`:
		case `readonly_pure_selector`:
		case `writable_held_selector`:
		case `readonly_held_selector`:
			disposeSelector(store, token)
			break
	}
}
