import type {
	AtomFamily,
	AtomFamilyOptions,
	MutableAtomFamily,
	MutableAtomFamilyOptions,
} from "atom.io"
import type { Json } from "atom.io/json"

import { type Transceiver, createMutableAtomFamily } from "../mutable"
import type { Store } from "../store"
import { createRegularAtomFamily } from "./create-regular-atom-family"

export function createAtomFamily<
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends Json.Serializable,
>(
	options: MutableAtomFamilyOptions<T, J, K>,
	store: Store,
): MutableAtomFamily<T, J, K>
export function createAtomFamily<T, K extends Json.Serializable>(
	options: AtomFamilyOptions<T, K>,
	store: Store,
): AtomFamily<T, K>
export function createAtomFamily<T, K extends Json.Serializable>(
	options: AtomFamilyOptions<T, K> | MutableAtomFamilyOptions<any, any, any>,
	store: Store,
): AtomFamily<T, K> | MutableAtomFamily<any, any, any> {
	const isMutable = `mutable` in options

	if (isMutable) {
		return createMutableAtomFamily(options, store)
	}
	return createRegularAtomFamily<T, K>(options, store)
}
