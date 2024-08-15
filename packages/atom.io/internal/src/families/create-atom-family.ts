import type {
	AtomFamilyToken,
	MutableAtomFamilyOptions,
	MutableAtomFamilyToken,
	RegularAtomFamilyOptions,
	RegularAtomFamilyToken,
} from "atom.io"
import type { Canonical, Json } from "atom.io/json"

import { createMutableAtomFamily, type Transceiver } from "../mutable"
import type { Store } from "../store"
import { createRegularAtomFamily } from "./create-regular-atom-family"

export function createAtomFamily<
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends Canonical,
>(
	store: Store,
	options: MutableAtomFamilyOptions<T, J, K>,
): MutableAtomFamilyToken<T, J, K>
export function createAtomFamily<T, K extends Canonical>(
	store: Store,
	options: RegularAtomFamilyOptions<T, K>,
): RegularAtomFamilyToken<T, K>
export function createAtomFamily<T, K extends Canonical>(
	store: Store,
	options:
		| MutableAtomFamilyOptions<any, any, any>
		| RegularAtomFamilyOptions<T, K>,
): AtomFamilyToken<any, any> {
	const isMutable = `mutable` in options

	if (isMutable) {
		return createMutableAtomFamily(store, options)
	}
	return createRegularAtomFamily<T, K>(store, options)
}
