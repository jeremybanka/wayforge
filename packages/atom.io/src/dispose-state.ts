import * as Internal from "atom.io/internal"
import type { Canonical, Json } from "atom.io/json"

import type { ReadableFamilyToken, ReadableToken } from "."
import type {
	MoleculeConstructor,
	MoleculeFamilyToken,
	MoleculeKey,
	MoleculeToken,
} from "./molecule"

export function disposeState(
	token: MoleculeToken<any> | ReadableToken<any>,
): void

export function disposeState<K extends Canonical>(
	token: ReadableFamilyToken<any, K>,
	key: K,
): void

export function disposeState<M extends MoleculeConstructor>(
	token: MoleculeFamilyToken<M>,
	key: MoleculeKey<M>,
): void

export function disposeState(
	token:
		| MoleculeFamilyToken<any>
		| MoleculeToken<any>
		| ReadableFamilyToken<any, any>
		| ReadableToken<any>,
	key?: Json.Serializable,
): void {
	if (key) {
		Internal.disposeFromStore(Internal.IMPLICIT.STORE, token as any, key)
	} else {
		Internal.disposeFromStore(Internal.IMPLICIT.STORE, token as any)
	}
}
