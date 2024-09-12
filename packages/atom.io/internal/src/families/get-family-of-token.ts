import type {
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
import type { Canonical, Json } from "atom.io/json"

import type { Transceiver } from "../mutable"
import type { Store } from "../store"

export function getFamilyOfToken<
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends Canonical,
>(
	store: Store,
	token: MutableAtomToken<T, J, K>,
): MutableAtomFamilyToken<T, J, K> | undefined

export function getFamilyOfToken<T, K extends Canonical>(
	store: Store,
	token: RegularAtomToken<T, K>,
): RegularAtomFamilyToken<T, K> | undefined

export function getFamilyOfToken<T, K extends Canonical>(
	store: Store,
	token: WritableSelectorToken<T, K>,
): WritableSelectorFamilyToken<T, K> | undefined

export function getFamilyOfToken<T, K extends Canonical>(
	store: Store,
	token: ReadonlySelectorToken<T, K>,
): ReadonlySelectorFamilyToken<T, K> | undefined

export function getFamilyOfToken<T, K extends Canonical>(
	store: Store,
	token: WritableToken<T, K>,
): WritableFamilyToken<T, K> | undefined

export function getFamilyOfToken<T, K extends Canonical>(
	store: Store,
	token: ReadableToken<T, K>,
): ReadableFamilyToken<T, K> | undefined

export function getFamilyOfToken(
	store: Store,
	token: ReadableToken<any, any>,
): ReadableFamilyToken<any, any> | undefined {
	if (token.family) {
		const family = store.families.get(token.family.key)
		if (family) {
			return family
		}
	}
}
