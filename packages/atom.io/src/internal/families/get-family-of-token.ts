import type {
	MutableAtomToken,
	ReadableToken,
	ReadonlyPureSelectorToken,
	RegularAtomToken,
	WritablePureSelectorToken,
	WritableToken,
} from "atom.io"
import type { Canonical } from "atom.io/json"

import type {
	MutableAtomFamily,
	ReadableFamily,
	ReadonlyPureSelectorFamily,
	RegularAtomFamily,
	WritableFamily,
	WritablePureSelectorFamily,
} from ".."
import type { Transceiver } from "../mutable"
import { type Store, withdraw } from "../store"

export function getFamilyOfToken<
	T extends Transceiver<any, any, any>,
	K extends Canonical,
>(store: Store, token: MutableAtomToken<T, K>): MutableAtomFamily<T, K>

export function getFamilyOfToken<T, K extends Canonical>(
	store: Store,
	token: RegularAtomToken<T, K>,
): RegularAtomFamily<T, K>

export function getFamilyOfToken<T, K extends Canonical>(
	store: Store,
	token: WritablePureSelectorToken<T, K>,
): WritablePureSelectorFamily<T, K>

export function getFamilyOfToken<T, K extends Canonical>(
	store: Store,
	token: ReadonlyPureSelectorToken<T, K>,
): ReadonlyPureSelectorFamily<T, K>

export function getFamilyOfToken<T, K extends Canonical>(
	store: Store,
	token: WritableToken<T, K>,
): WritableFamily<T, K>
export function getFamilyOfToken<T, K extends Canonical>(
	store: Store,
	token: ReadableToken<T, K>,
): ReadableFamily<T, K>

export function getFamilyOfToken(
	store: Store,
	token: ReadableToken<any, any>,
): ReadableFamily<any, any> {
	return withdraw(store, {
		// biome-ignore lint/style/noNonNullAssertion: family is required
		key: token.family!.key,
		type: `${token.type}_family`,
	})
}
