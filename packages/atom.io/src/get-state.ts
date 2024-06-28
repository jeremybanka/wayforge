import * as Internal from "atom.io/internal"
import type { Json } from "atom.io/json"

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

export function getState<T, K extends Json.Serializable>(
	token: ReadableFamilyToken<T, K>,
	key: K,
): T

export function getState<M extends MoleculeConstructor>(
	token: MoleculeFamilyToken<M>,
	key: Json.Serializable,
): InstanceType<M>

export function getState(
	token:
		| MoleculeFamilyToken<any>
		| MoleculeToken<any>
		| ReadableFamilyToken<any, any>
		| ReadableToken<any>,
	key?: Json.Serializable,
): any {
	return Internal.getFromStore(
		token as Parameters<typeof Internal.getFromStore>[0],
		key as Parameters<typeof Internal.getFromStore>[1],
		Internal.IMPLICIT.STORE,
	)
}
