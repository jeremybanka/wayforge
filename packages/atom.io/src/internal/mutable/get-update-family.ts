import type { MutableAtomFamilyToken } from "atom.io"
import type { Json } from "atom.io/json"

import type { AtomFamily } from ".."
import { newest } from "../lineage"
import type { Store } from "../store"
import type { Signal, Transceiver } from "./transceiver"

export const getUpdateFamily = <
	T extends Transceiver<Json.Serializable, Json.Serializable>,
	K extends string,
>(
	mutableAtomFamily: MutableAtomFamilyToken<T, K>,
	store: Store,
): AtomFamily<Signal<T>, K> => {
	const target = newest(store)
	const key = `*${mutableAtomFamily.key}`
	const updateFamily: AtomFamily<Signal<T>, K> = target.families.get(
		key,
	) as AtomFamily<Signal<T>, K>
	return updateFamily
}
