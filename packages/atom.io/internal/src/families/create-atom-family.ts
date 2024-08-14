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
	options: MutableAtomFamilyOptions<T, J, K>,
	store: Store,
): MutableAtomFamilyToken<T, J, K>
export function createAtomFamily<T, K extends Canonical>(
	options: RegularAtomFamilyOptions<T, K>,
	store: Store,
): RegularAtomFamilyToken<T, K>
export function createAtomFamily<T, K extends Canonical>(
	options:
		| MutableAtomFamilyOptions<any, any, any>
		| RegularAtomFamilyOptions<T, K>,
	store: Store,
): AtomFamilyToken<any, any> {
	const isMutable = `mutable` in options

	if (isMutable) {
		return createMutableAtomFamily(options, store)
	}
	return createRegularAtomFamily<T, K>(options, store)
}
