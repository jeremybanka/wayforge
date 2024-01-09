import type { MutableAtomFamily, RegularAtomFamily } from "atom.io"
import type { Json } from "atom.io/json"

import { newest } from "../lineage"
import type { Store } from "../store"
import type { Signal, Transceiver } from "./transceiver"

export const getUpdateFamily = <
	Core extends Transceiver<Json.Serializable>,
	SerializableCore extends Json.Serializable,
	Key extends string,
>(
	mutableAtomFamily: MutableAtomFamily<Core, SerializableCore, Key>,
	store: Store,
): RegularAtomFamily<Signal<Core> | null, Key> => {
	const target = newest(store)
	const key = `*${mutableAtomFamily.key}`
	const updateFamily = target.families.get(key) as RegularAtomFamily<
		Signal<Core> | null,
		Key
	>
	return updateFamily
}
