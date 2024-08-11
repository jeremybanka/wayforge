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

export function getState<T, K extends Canonical>(
	token: ReadableFamilyToken<T, K>,
	key: K,
): T

export function getState<M extends MoleculeConstructor>(
	token: MoleculeFamilyToken<M>,
	key: Canonical,
): InstanceType<M>

export function getState(
	token:
		| MoleculeFamilyToken<any>
		| MoleculeToken<any>
		| ReadableFamilyToken<any, any>
		| ReadableToken<any>,
	key?: Canonical,
): any {
	if (key) {
		return Internal.getFromStore(
			token as any,
			key as any,
			Internal.IMPLICIT.STORE,
		)
	}
	return Internal.getFromStore(token as any, Internal.IMPLICIT.STORE)
}
