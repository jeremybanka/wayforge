import type {
	MoleculeConstructor,
	MoleculeFamilyToken,
	MoleculeToken,
	ReadableFamilyToken,
	ReadableToken,
} from "atom.io"
import type { Json } from "atom.io/json"

import { seekInStore } from "../families"
import { NotFoundError } from "../not-found-error"
import type { Store } from "../store"
import { withdraw } from "../store"
import { readOrComputeValue } from "./read-or-compute-value"

export function getFromStore<T>(
	token: ReadableToken<T>,
	key: undefined,
	store: Store,
): T

export function getFromStore<M extends MoleculeConstructor>(
	token: MoleculeToken<M>,
	undefinedKey: undefined,
	store: Store,
): InstanceType<M> | undefined

export function getFromStore<T, K extends Json.Serializable>(
	token: ReadableFamilyToken<T, K>,
	key: K,
	store: Store,
): T

export function getFromStore<M extends MoleculeConstructor>(
	token: MoleculeFamilyToken<M>,
	key: Json.Serializable,
	store: Store,
): InstanceType<M>

export function getFromStore<
	Token extends
		| MoleculeFamilyToken<any>
		| MoleculeToken<any>
		| ReadableFamilyToken<any, any>
		| ReadableToken<any>,
>(token: Token, key: Json.Serializable | undefined, store: Store): any {
	if (key === undefined)
		switch (token.type) {
			case `atom`:
			case `mutable_atom`:
			case `selector`:
			case `readonly_selector`:
				return readOrComputeValue(withdraw(token, store), store)
			case `molecule`:
				return withdraw(token, store).instance
		}
	if (key)
		switch (token.type) {
			case `atom_family`:
			case `mutable_atom_family`:
			case `selector_family`:
			case `readonly_selector_family`: {
				const member = seekInStore(token, key, store)
				if (!member) throw new NotFoundError(token, store)
				return getFromStore(member, undefined, store)
			}
			case `molecule_family`: {
				const member = seekInStore(token, key, store)
				if (!member) throw new NotFoundError(token, store)
				return getFromStore(member, undefined, store)
			}
		}
}
