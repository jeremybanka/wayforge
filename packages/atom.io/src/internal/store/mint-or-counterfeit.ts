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

export function mint<T, K extends Canonical, Key extends K>(
	token: RegularAtomFamilyToken<T, K>,
	key: Key,
	counterfeit?: typeof COUNTERFEIT,
): RegularAtomToken<T>

export function mint<T, K extends Canonical, Key extends K>(
	token: AtomFamilyToken<T, K>,
	key: Key,
	counterfeit?: typeof COUNTERFEIT,
): AtomToken<T>

export function mint<T, K extends Canonical, Key extends K>(
	token: WritablePureSelectorFamilyToken<T, K>,
	key: Key,
	counterfeit?: typeof COUNTERFEIT,
): WritablePureSelectorToken<T>

export function mint<T, K extends Canonical, Key extends K>(
	token: ReadonlyPureSelectorFamilyToken<T, K>,
	key: Key,
	counterfeit?: typeof COUNTERFEIT,
): ReadonlyPureSelectorToken<T>

export function mint<T, K extends Canonical, Key extends K>(
	token: SelectorFamilyToken<T, K>,
	key: Key,
	counterfeit?: typeof COUNTERFEIT,
): SelectorToken<T>

export function mint<T, K extends Canonical, Key extends K>(
	token: WritableFamilyToken<T, K>,
	key: Key,
	counterfeit?: typeof COUNTERFEIT,
): WritableToken<T>

export function mint<T, K extends Canonical, Key extends K>(
	token: ReadableFamilyToken<T, K>,
	key: Key,
	counterfeit?: typeof COUNTERFEIT,
): ReadableToken<T>

export function mint(
	token: ReadableFamilyToken<any, any>,
	key: Canonical,
	counterfeit?: typeof COUNTERFEIT,
): ReadableToken<any> {
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
