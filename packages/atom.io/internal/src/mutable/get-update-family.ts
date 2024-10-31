import type { MutableAtomFamilyToken } from "atom.io"
import type { Json } from "atom.io/json"

import type { AtomFamily } from ".."
import { newest } from "../lineage"
import type { Store } from "../store"
import type { Signal, Transceiver } from "./transceiver"

export const getUpdateFamily = <
	Core extends Transceiver<Json.Serializable>,
	SerializableCore extends Json.Serializable,
	Key extends string,
>(
	store: Store,
	mutableAtomFamily: MutableAtomFamilyToken<Core, SerializableCore, Key>,
): AtomFamily<Signal<Core>, Key> => {
	const target = newest(store)
	const key = `*${mutableAtomFamily.key}`
	const updateFamily: AtomFamily<Signal<Core>, Key> = target.families.get(
		key,
	) as AtomFamily<Signal<Core>, Key>
	return updateFamily
}
