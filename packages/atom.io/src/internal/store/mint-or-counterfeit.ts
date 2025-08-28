import type {
	AtomFamilyToken,
	AtomToken,
	MutableAtomFamilyToken,
	MutableAtomToken,
	ReadableFamilyToken,
	ReadableToken,
	ReadonlyPureSelectorFamilyToken,
	ReadonlyPureSelectorToken,
	RegularAtomFamilyToken,
	RegularAtomToken,
	SelectorFamilyToken,
	SelectorToken,
	WritableFamilyToken,
	WritablePureSelectorFamilyToken,
	WritablePureSelectorToken,
	WritableToken,
} from "atom.io"
import type { Canonical } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import type { Transceiver } from "../mutable"

export const COUNTERFEIT: unique symbol = Symbol(`counterfeit`)

export const FAMILY_MEMBER_TOKEN_TYPES = {
	atom_family: `atom`,
	molecule_family: `molecule`,
	mutable_atom_family: `mutable_atom`,
	readonly_held_selector_family: `readonly_held_selector`,
	readonly_pure_selector_family: `readonly_pure_selector`,
	writable_held_selector_family: `writable_held_selector`,
	writable_pure_selector_family: `writable_pure_selector`,
} as const

export function mint<
	T extends Transceiver<any, any, any>,
	K extends Canonical,
	Key extends K,
>(token: MutableAtomFamilyToken<T, K>, key: Key): MutableAtomToken<T>

export function mint<T, K extends Canonical, Key extends K, E>(
	token: RegularAtomFamilyToken<T, K, E>,
	key: Key,
	counterfeit?: typeof COUNTERFEIT,
): RegularAtomToken<T, Key, E>

export function mint<T, K extends Canonical, Key extends K, E>(
	token: AtomFamilyToken<T, K, E>,
	key: Key,
	counterfeit?: typeof COUNTERFEIT,
): AtomToken<T, Key, E>

export function mint<T, K extends Canonical, Key extends K, E>(
	token: WritablePureSelectorFamilyToken<T, K, E>,
	key: Key,
	counterfeit?: typeof COUNTERFEIT,
): WritablePureSelectorToken<T, Key, E>

export function mint<T, K extends Canonical, Key extends K, E>(
	token: ReadonlyPureSelectorFamilyToken<T, K, E>,
	key: Key,
	counterfeit?: typeof COUNTERFEIT,
): ReadonlyPureSelectorToken<T, Key, E>

export function mint<T, K extends Canonical, Key extends K, E>(
	token: SelectorFamilyToken<T, K, E>,
	key: Key,
	counterfeit?: typeof COUNTERFEIT,
): SelectorToken<T, Key, E>

export function mint<T, K extends Canonical, Key extends K, E>(
	token: WritableFamilyToken<T, K, E>,
	key: Key,
	counterfeit?: typeof COUNTERFEIT,
): WritableToken<T, Key, E>

export function mint<T, K extends Canonical, Key extends K, E>(
	token: ReadableFamilyToken<T, K, E>,
	key: Key,
	counterfeit?: typeof COUNTERFEIT,
): ReadableToken<T, Key, E>

export function mint(
	token: ReadableFamilyToken<any, any, any>,
	key: Canonical,
	counterfeit?: typeof COUNTERFEIT,
): ReadableToken<any, any, any> {
	const subKey = stringifyJson(key)
	const fullKey = `${token.key}(${subKey})`
	const type = FAMILY_MEMBER_TOKEN_TYPES[token.type]
	const stateToken: ReadableToken<any> & {
		counterfeit?: boolean
	} = {
		key: fullKey,
		type,
		family: {
			key: token.key,
			subKey,
		},
	}

	if (counterfeit) {
		stateToken.counterfeit = true
	}

	return stateToken
}
