import type {
	MoleculeConstructor,
	MoleculeFamilyToken,
	MoleculeKey,
	MoleculeToken,
	ReadableFamilyToken,
	ReadableToken,
} from "atom.io"
import { type Canonical, stringifyJson } from "atom.io/json"

import { findInStore, seekInStore } from "../families"
import { NotFoundError } from "../not-found-error"
import type { Store } from "../store"
import { counterfeit, withdraw } from "../store"
import { readOrComputeValue } from "./read-or-compute-value"

export function getFromStore<T>(store: Store, token: ReadableToken<T>): T

export function getFromStore<M extends MoleculeConstructor>(
	store: Store,
	token: MoleculeToken<M>,
): InstanceType<M>

export function getFromStore<T, K extends Canonical>(
	store: Store,
	token: ReadableFamilyToken<T, K>,
	key: K,
): T

export function getFromStore<M extends MoleculeConstructor>(
	store: Store,
	token: MoleculeFamilyToken<M>,
	key: MoleculeKey<M>,
): InstanceType<M>

export function getFromStore(
	store: Store,
	token: MoleculeToken<any> | ReadableToken<any>,
): any

export function getFromStore(
	store: Store,
	token: MoleculeFamilyToken<any> | ReadableFamilyToken<any, any>,
	key: Canonical,
): any

export function getFromStore(
	store: Store,
	...params:
		| [
				token: MoleculeFamilyToken<any> | ReadableFamilyToken<any, any>,
				key: Canonical,
		  ]
		| [token: MoleculeFamilyToken<any>, key: MoleculeKey<any>]
		| [token: MoleculeToken<any> | ReadableToken<any>]
		| [token: MoleculeToken<any>]
		| [token: ReadableFamilyToken<any, any>, key: Canonical]
		| [token: ReadableToken<any>]
): any {
	let token: MoleculeToken<any> | ReadableToken<any>
	if (params.length === 1) {
		token = params[0]
	} else {
		const family = params[0]
		const key = params[1]
		let maybeToken: MoleculeToken<any> | ReadableToken<any>
		if (family.type === `molecule_family`) {
			maybeToken = seekInStore(store, family, key) ?? counterfeit(family, key)
		} else {
			maybeToken = findInStore(store, family, key)
		}
		token = maybeToken
	}
	if (`counterfeit` in token && `family` in token) {
		const family =
			token.type === `molecule`
				? withdraw(token.family, store)
				: // biome-ignore lint/style/noNonNullAssertion: family must be present
					store.families.get(token.family.key)!
		const subKey = token.type === `molecule` ? token.key : token.family.subKey
		const disposal = store.disposalTraces.buffer.find(
			(item) => item?.key === token.key,
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
			case `atom_family`:
			case `mutable_atom_family`:
				return store.defaults.get(family.key)
			case `selector_family`:
			case `readonly_selector_family`: {
				if (store.defaults.has(family.key)) {
					return store.defaults.get(token.family.key)
				}
				const defaultValue = withdraw(family, store).default(subKey)
				store.defaults.set(family.key, defaultValue)
				return defaultValue
			}
			case `molecule_family`:
				throw new NotFoundError(family, subKey, store)
		}
	}
	switch (token.type) {
		case `atom`:
		case `mutable_atom`:
		case `selector`:
		case `readonly_selector`:
			return readOrComputeValue(withdraw(token, store), store)
		case `molecule`:
			return withdraw(token, store).instance
	}
}
