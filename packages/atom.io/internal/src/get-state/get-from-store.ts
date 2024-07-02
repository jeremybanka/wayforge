import type {
	getState,
	MoleculeConstructor,
	MoleculeFamilyToken,
	MoleculeKey,
	MoleculeToken,
	ReadableFamilyToken,
	ReadableToken,
} from "atom.io"
import type { Json } from "atom.io/json"

import { findInStore, seekInStore } from "../families"
import { NotFoundError } from "../not-found-error"
import type { Store } from "../store"
import { IMPLICIT, withdraw } from "../store"
import { readOrComputeValue } from "./read-or-compute-value"

export function getFromStore<T>(token: ReadableToken<T>, store: Store): T

export function getFromStore<M extends MoleculeConstructor>(
	token: MoleculeToken<M>,
	store: Store,
): InstanceType<M> | undefined

export function getFromStore<T, K extends Json.Serializable>(
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
		| [token: ReadableFamilyToken<T, any>, key: Json.Serializable, store: Store]
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
			throw new NotFoundError(family, key, store)
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

export function composeGetState(store: Store): typeof getState {
	return function get(...params: Parameters<typeof getState>) {
		return getFromStore(...params, store)
	} as typeof getState
}
