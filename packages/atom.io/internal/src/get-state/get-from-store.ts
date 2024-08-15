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

export function getFromStore<T>(token: ReadableToken<T>, store: Store): T

export function getFromStore<M extends MoleculeConstructor>(
	token: MoleculeToken<M>,
	store: Store,
): InstanceType<M> | undefined

export function getFromStore<T, K extends Canonical>(
	token: ReadableFamilyToken<T, K>,
	key: K,
	store: Store,
): T

export function getFromStore<M extends MoleculeConstructor>(
	token: MoleculeFamilyToken<M>,
	key: MoleculeKey<M>,
	store: Store,
): InstanceType<M>

export function getFromStore<T>(
	...params:
		| [token: MoleculeFamilyToken<any>, key: MoleculeKey<any>, store: Store]
		| [token: MoleculeToken<any>, store: Store]
		| [token: ReadableFamilyToken<T, any>, key: Canonical, store: Store]
		| [token: ReadableToken<T>, store: Store]
): any {
	let token: MoleculeToken<any> | ReadableToken<T>
	let store: Store
	if (params.length === 2) {
		token = params[0]
		store = params[1]
	} else {
		const family = params[0]
		const key = params[1]
		store = params[2]
		const maybeToken =
			family.type === `molecule_family`
				? seekInStore(family, key, store)
				: store.config.lifespan === `immortal`
					? seekInStore(family, key, store)
					: findInStore(family, key, store)
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
