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

export function getFamilyOfToken<T, K extends Canonical, E>(
	store: Store,
	token: RegularAtomToken<T, K, E>,
): RegularAtomFamily<T, K, E>

export function getFamilyOfToken<T, K extends Canonical, E>(
	store: Store,
	token: WritablePureSelectorToken<T, K, E>,
): WritablePureSelectorFamily<T, K, E>

export function getFamilyOfToken<T, K extends Canonical, E>(
	store: Store,
	token: ReadonlyPureSelectorToken<T, K, E>,
): ReadonlyPureSelectorFamily<T, K, E>

export function getFamilyOfToken<T, K extends Canonical, E>(
	store: Store,
	token: WritableToken<T, K, E>,
): WritableFamily<T, K, E>

export function getFamilyOfToken<T, K extends Canonical, E>(
	store: Store,
	token: ReadableToken<T, K, E>,
): ReadableFamily<T, K, E>

export function getFamilyOfToken(
	store: Store,
	token: ReadableToken<any, any, any>,
): ReadableFamily<any, any, any> {
	return withdraw(store, {
		// biome-ignore lint/style/noNonNullAssertion: family is required
		key: token.family!.key,
		type: `${token.type}_family`,
	})
}
