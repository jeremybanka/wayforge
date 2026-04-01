import type { ReadableFamilyToken, ReadableToken } from "atom.io"
import type { Canonical } from "atom.io/json"

import { disposeAtom } from "../atom"
import { newest } from "../lineage"
import { disposeSelector } from "../selector"
import { deposit, type Store, withdraw } from "../store"
import { findInStore } from "./find-in-store"

export function disposeFromStore(
	store: Store,
	token: ReadableToken<any, any, any>,
): void

export function disposeFromStore<K extends Canonical>(
	store: Store,
	token: ReadableFamilyToken<any, K, any>,
): void

export function disposeFromStore<K extends Canonical>(
	store: Store,
	token: ReadableFamilyToken<any, K, any>,
	key: NoInfer<K>,
): void

export function disposeFromStore<K extends Canonical>(
	store: Store,
	...params:
		| [token: ReadableFamilyToken<any, K, any>]
		| [token: ReadableFamilyToken<any, K, any>, key: NoInfer<K>]
		| [token: ReadableToken<any, any, any>]
): void

export function disposeFromStore(
	store: Store,
	...params:
		| [token: ReadableFamilyToken<any, any, any>]
		| [token: ReadableFamilyToken<any, any, any>, key: Canonical]
		| [token: ReadableToken<any, any, any>]
): void {
	let token: ReadableToken<any, any, any>
	if (params.length === 1) {
		const candidate = params[0]
		if (candidate.type.endsWith(`_family`)) {
			const familyToken = candidate
			const target = newest(store)
			const states =
				familyToken.type === `atom_family` ||
				familyToken.type === `mutable_atom_family`
					? target.atoms.values()
					: familyToken.type === `writable_held_selector_family` ||
						  familyToken.type === `writable_pure_selector_family`
						? target.writableSelectors.values()
						: target.readonlySelectors.values()
			const tokens = [...states]
				.filter((state) => state.family?.key === familyToken.key)
				.map((state) => deposit(state))
			for (const token of tokens) {
				disposeFromStore(store, token)
			}
			return
		}
		token = candidate as ReadableToken<any, any, any>
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
