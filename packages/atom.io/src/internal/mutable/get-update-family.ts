import type { MutableAtomFamilyToken } from "atom.io"
import type { Json } from "atom.io/json"

import { newest } from "../lineage"
import type { RegularAtomFamily } from "../state-types"
import type { Store } from "../store"
import type { SignalFrom, Transceiver } from "./transceiver"

export const getUpdateFamily = <
	T extends Transceiver<any, Json.Serializable, Json.Serializable>,
	K extends string,
>(
	mutableAtomFamily: MutableAtomFamilyToken<T, K>,
	store: Store,
): RegularAtomFamily<SignalFrom<T>, K, never> => {
	const target = newest(store)
	const key = `*${mutableAtomFamily.key}`
	const updateFamily = target.families.get(key) as RegularAtomFamily<
		SignalFrom<T>,
		K,
		never
	>
	return updateFamily
}
