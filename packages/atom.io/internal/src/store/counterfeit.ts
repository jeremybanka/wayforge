import type {
	AtomFamilyToken,
	AtomToken,
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
	SelectorFamilyToken,
	SelectorToken,
	WritableFamilyToken,
	WritableSelectorFamilyToken,
	WritableSelectorToken,
	WritableToken,
} from "atom.io"
import type { Canonical, Json } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import type { Transceiver } from "../mutable"

export const FAMILY_MEMBER_TOKEN_TYPES = {
	atom_family: `atom`,
	mutable_atom_family: `mutable_atom`,
	selector_family: `selector`,
	readonly_selector_family: `readonly_selector`,
	molecule_family: `molecule`,
} as const

export function counterfeit<
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends Canonical,
	Key extends K,
>(token: MutableAtomFamilyToken<T, J, K>, key: Key): MutableAtomToken<T, J>

export function counterfeit<T, K extends Canonical, Key extends K>(
	token: RegularAtomFamilyToken<T, K>,
	key: Key,
): RegularAtomToken<T>

export function counterfeit<T, K extends Canonical, Key extends K>(
	token: AtomFamilyToken<T, K>,
	key: Key,
): AtomToken<T>

export function counterfeit<T, K extends Canonical, Key extends K>(
	token: WritableSelectorFamilyToken<T, K>,
	key: Key,
): WritableSelectorToken<T>

export function counterfeit<T, K extends Canonical, Key extends K>(
	token: ReadonlySelectorFamilyToken<T, K>,
	key: Key,
): ReadonlySelectorToken<T>

export function counterfeit<T, K extends Canonical, Key extends K>(
	token: SelectorFamilyToken<T, K>,
	key: Key,
): SelectorToken<T>

export function counterfeit<T, K extends Canonical, Key extends K>(
	token: WritableFamilyToken<T, K>,
	key: Key,
): WritableToken<T>

export function counterfeit<T, K extends Canonical, Key extends K>(
	token: ReadableFamilyToken<T, K>,
	key: Key,
): ReadableToken<T>

export function counterfeit<M extends MoleculeConstructor>(
	token: MoleculeFamilyToken<M>,
	key: MoleculeKey<M>,
): MoleculeKey<M>

export function counterfeit(
	token: MoleculeFamilyToken<any> | ReadableFamilyToken<any, any>,
	key: Canonical,
): MoleculeToken<any> | ReadableToken<any> {
	const subKey = stringifyJson(key)
	const fullKey = `${token.key}(${subKey})`
	const type = FAMILY_MEMBER_TOKEN_TYPES[token.type]
	const stateToken = {
		key: fullKey,
		type,
	} satisfies MoleculeToken<any> | ReadableToken<any>
	if (type === `molecule`) {
		Object.assign(stateToken, {
			key,
			family: token,
		})
	} else {
		Object.assign(stateToken, {
			family: {
				key: token.key,
				subKey,
			},
		})
	}
	Object.assign(stateToken, { counterfeit: true })
	return stateToken
}
