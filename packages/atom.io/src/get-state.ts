import * as Internal from "atom.io/internal"
import type { Canonical } from "atom.io/json"

import type {
	MoleculeConstructor,
	MoleculeFamilyToken,
	MoleculeToken,
	ReadableFamilyToken,
	ReadableToken,
} from "."

export function getState<T>(token: ReadableToken<T>): T

export function getState<M extends MoleculeConstructor>(
	token: MoleculeToken<M>,
): InstanceType<M>

export function getState<T, K extends Canonical, Key extends K>(
	token: ReadableFamilyToken<T, K>,
	key: Key,
): T

export function getState<M extends MoleculeConstructor>(
	token: MoleculeFamilyToken<M>,
	key: Canonical,
): InstanceType<M>

export function getState(
	...params:
		| [
				token: MoleculeFamilyToken<any> | ReadableFamilyToken<any, any>,
				key: Canonical,
		  ]
		| [token: MoleculeToken<any> | ReadableToken<any>]
): any {
	if (params.length === 2) {
		Internal.getFromStore(Internal.IMPLICIT.STORE, ...params)
	}
	return Internal.getFromStore(Internal.IMPLICIT.STORE, ...params)
}
