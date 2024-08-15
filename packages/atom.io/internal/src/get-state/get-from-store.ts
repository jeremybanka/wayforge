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
import { withdraw } from "../store"
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

export function getFromStore<T>(
	store: Store,
	...params:
		| [token: MoleculeFamilyToken<any>, key: MoleculeKey<any>]
		| [token: MoleculeToken<any>]
		| [token: ReadableFamilyToken<T, any>, key: Canonical]
		| [token: ReadableToken<T>]
): any {
	let token: MoleculeToken<any> | ReadableToken<T>
	if (params.length === 1) {
		token = params[0]
	} else {
		const family = params[0]
		const key = params[1]
		const maybeToken =
			family.type === `molecule_family`
				? seekInStore(store, family, key)
				: store.config.lifespan === `immortal`
					? seekInStore(store, family, key)
					: findInStore(store, family, key)
		if (!maybeToken) {
			store.logger.error(
				`❗`,
				family.type,
				family.key,
				`tried to get member`,
				stringifyJson(key),
				`but it was not found in store`,
				store.config.name,
			)
			switch (family.type) {
				case `atom_family`:
				case `mutable_atom_family`:
					return store.defaults.get(family.key)
				case `selector_family`:
				case `readonly_selector_family`: {
					if (store.defaults.has(family.key)) {
						return store.defaults.get(family.key)
					}
					const defaultValue = withdraw(family, store).default(key)
					store.defaults.set(family.key, defaultValue)
					return defaultValue
				}
				case `molecule_family`:
					throw new NotFoundError(family, key, store)
			}
		}
		token = maybeToken
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
