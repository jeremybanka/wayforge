import type { MutableAtomFamilyToken } from "atom.io"
import type { Json } from "atom.io/json"

import type { AtomFamily } from ".."
import { newest } from "../lineage"
import type { Store } from "../store"
import type { SignalFrom, Transceiver } from "./transceiver"

export const getUpdateFamily = <
	T extends Transceiver<any, Json.Serializable, Json.Serializable>,
	K extends string,
>(
	mutableAtomFamily: MutableAtomFamilyToken<T, K>,
	store: Store,
): AtomFamily<SignalFrom<T>, K> => {
	const target = newest(store)
	const key = `*${mutableAtomFamily.key}`
	const updateFamily: AtomFamily<SignalFrom<T>, K> = target.families.get(
		key,
	) as AtomFamily<SignalFrom<T>, K>
	return updateFamily
}
