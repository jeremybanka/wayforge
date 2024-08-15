import type {
	MoleculeConstructor,
	MoleculeFamilyToken,
	MoleculeKey,
	MoleculeToken,
	ReadableFamilyToken,
	ReadableToken,
} from "atom.io"
import { type Canonical, stringifyJson } from "atom.io/json"

import { disposeAtom } from "../atom"
import { disposeMolecule } from "../molecule/dispose-molecule"
import { NotFoundError } from "../not-found-error"
import { disposeSelector } from "../selector"
import type { Store } from "../store"
import { findInStore } from "./find-in-store"
import { seekInStore } from "./seek-in-store"

export function disposeFromStore(
	token: MoleculeToken<any> | ReadableToken<any>,
	store: Store,
): void

export function disposeFromStore<K extends Canonical>(
	token: ReadableFamilyToken<any, K>,
	key: K,
	store: Store,
): void

export function disposeFromStore<M extends MoleculeConstructor>(
	token: MoleculeFamilyToken<M>,
	key: MoleculeKey<M>,
	store: Store,
): void

export function disposeFromStore(
	...params:
		| [token: MoleculeFamilyToken<any>, key: MoleculeKey<any>, store: Store]
		| [token: MoleculeToken<any> | ReadableToken<any>, store: Store]
		| [token: ReadableFamilyToken<any, any>, key: Canonical, store: Store]
): void {
	let token: MoleculeToken<any> | ReadableToken<any>
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
				`tried to dispose of member`,
				stringifyJson(key),
				`but it was not found in store`,
				store.config.name,
			)
			return
		}
		token = maybeToken
	}
	switch (token.type) {
		case `atom`:
		case `mutable_atom`:
			disposeAtom(token, store)
			break
		case `selector`:
		case `readonly_selector`:
			disposeSelector(token, store)
			break
		case `molecule`:
			disposeMolecule(token, store)
			break
	}
}
