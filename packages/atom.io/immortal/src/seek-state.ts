import type {
	MoleculeConstructor,
	MoleculeFamilyToken,
	MoleculeKey,
	MoleculeToken,
	MutableAtomFamilyToken,
	MutableAtomToken,
	ReadableFamilyToken,
	ReadableToken,
	ReadonlySelectorFamilyToken,
	ReadonlySelectorToken,
	RegularAtomFamilyToken,
	RegularAtomToken,
	WritableFamilyToken,
	WritableSelectorFamilyToken,
	WritableSelectorToken,
	WritableToken,
} from "atom.io"
import type { Transceiver } from "atom.io/internal"
import { IMPLICIT, seekInStore } from "atom.io/internal"
import type { Canonical, Json } from "atom.io/json"

export function seekState<
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends Canonical,
	Key extends K,
>(
	token: MutableAtomFamilyToken<T, J, K>,
	key: Key,
): MutableAtomToken<T, J> | undefined

export function seekState<T, K extends Canonical, Key extends K>(
	token: RegularAtomFamilyToken<T, K>,
	key: Key,
): RegularAtomToken<T> | undefined

export function seekState<T, K extends Canonical, Key extends K>(
	token: WritableSelectorFamilyToken<T, K>,
	key: Key,
): WritableSelectorToken<T> | undefined

export function seekState<T, K extends Canonical, Key extends K>(
	token: ReadonlySelectorFamilyToken<T, K>,
	key: Key,
): ReadonlySelectorToken<T> | undefined

export function seekState<T, K extends Canonical, Key extends K>(
	token: WritableFamilyToken<T, K>,
	key: Key,
): WritableToken<T> | undefined

export function seekState<T, K extends Canonical, Key extends K>(
	token: ReadableFamilyToken<T, K>,
	key: Key,
): ReadableToken<T> | undefined

export function seekState<M extends MoleculeConstructor>(
	token: MoleculeFamilyToken<M>,
	key: MoleculeKey<M>,
): MoleculeToken<M> | undefined

export function seekState(
	token: MoleculeFamilyToken<any> | ReadableFamilyToken<any, any>,
	key: Canonical,
): MoleculeToken<any> | ReadableToken<any> | undefined {
	if (token.type === `molecule_family`) {
		return seekInStore(IMPLICIT.STORE, token, key)
	}
	const state = seekInStore(IMPLICIT.STORE, token, key)
	return state
}
