import type { ReadableFamilyToken, ReadableToken } from "atom.io"
import { type Canonical, parseJson } from "atom.io/json"

import { findInStore } from "../families"
import type { Store } from "../store"
import { withdraw } from "../store"
import { readOrComputeValue } from "./read-or-compute-value"

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
	let token: ReadableToken<any>
	let family: ReadableFamilyToken<any, Canonical> | null
	let key: Canonical | null
	if (params.length === 1) {
		token = params[0]
	} else {
		family = params[0]
		key = params[1]
		token = findInStore(store, family, key)
	}
	if (`counterfeit` in token && `family` in token) {
		// biome-ignore lint/style/noNonNullAssertion: family must be present
		family = store.families.get(token.family.key)!
		const subKey = token.family.subKey
		const disposal = store.disposalTraces.buffer.find(
			(item) => item?.key === subKey,
		)
		store.logger.error(
			`❌`,
			token.type,
			token.key,
			`could not be retrieved because it was not found in the store "${store.config.name}".`,
			disposal
				? `This state was previously disposed:\n${disposal.trace}`
				: `No previous disposal trace was found.`,
		)
		switch (family.type) {
			case `mutable_atom_family`: {
				if (store.defaults.has(family.key)) {
					return store.defaults.get(family.key)
				}
				const mutableFamily = withdraw(store, family)
				const defaultValue = new mutableFamily.class()
				store.defaults.set(family.key, defaultValue)
				return defaultValue
			}
			case `atom_family`: {
				if (store.defaults.has(family.key)) {
					return store.defaults.get(token.family.key)
				}
				const defaultValue = withdraw(store, family).default(parseJson(subKey))
				store.defaults.set(family.key, defaultValue)
				return defaultValue
			}
			case `readonly_pure_selector_family`:
			case `writable_pure_selector_family`:
			case `readonly_held_selector_family`:
			case `writable_held_selector_family`: {
				if (store.defaults.has(family.key)) {
					return store.defaults.get(token.family.key)
				}
				const defaultValue = withdraw(store, family).default(parseJson(subKey))
				store.defaults.set(family.key, defaultValue)
				return defaultValue
			}
		}
	}

	return readOrComputeValue(store, withdraw(store, token))
}
