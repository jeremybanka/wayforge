import type {
	AtomFamilyToken,
	AtomToken,
	MutableAtomFamilyToken,
	MutableAtomToken,
	ReadableFamilyToken,
	ReadableToken,
	ReadonlyTransientSelectorFamilyToken,
	ReadonlyTransientSelectorToken,
	RegularAtomFamilyToken,
	RegularAtomToken,
	SelectorFamilyToken,
	SelectorToken,
	WritableFamilyToken,
	WritableToken,
	WritableTransientSelectorFamilyToken,
	WritableTransientSelectorToken,
} from "atom.io"
import type { Canonical, Json } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import type { Transceiver } from "../mutable"

export const FAMILY_MEMBER_TOKEN_TYPES = {
	atom_family: `atom`,
	molecule_family: `molecule`,
	mutable_atom_family: `mutable_atom`,
	readonly_recyclable_selector_family: `readonly_recyclable_selector`,
	readonly_transient_selector_family: `readonly_transient_selector`,
	writable_recyclable_selector_family: `writable_recyclable_selector`,
	writable_transient_selector_family: `writable_transient_selector`,
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
	token: WritableTransientSelectorFamilyToken<T, K>,
	key: Key,
): WritableTransientSelectorToken<T>

export function counterfeit<T, K extends Canonical, Key extends K>(
	token: ReadonlyTransientSelectorFamilyToken<T, K>,
	key: Key,
): ReadonlyTransientSelectorToken<T>

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

export function counterfeit(
	token: ReadableFamilyToken<any, any>,
	key: Canonical,
): ReadableToken<any> {
	const subKey = stringifyJson(key)
	const fullKey = `${token.key}(${subKey})`
	const type = FAMILY_MEMBER_TOKEN_TYPES[token.type]
	const stateToken = {
		key: fullKey,
		type,
	} satisfies ReadableToken<any>

	Object.assign(stateToken, {
		family: {
			key: token.key,
			subKey,
		},
	})

	Object.assign(stateToken, { counterfeit: true })
	return stateToken
}
