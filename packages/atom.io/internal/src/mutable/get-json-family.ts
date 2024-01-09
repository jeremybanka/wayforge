import type { MutableAtomFamily, WritableSelectorFamily } from "atom.io"
import type { Json } from "atom.io/json"

import { newest } from "../lineage"
import type { Store } from "../store"
import type { Transceiver } from "./transceiver"

export const getJsonFamily = <
	Core extends Transceiver<Json.Serializable>,
	SerializableCore extends Json.Serializable,
	Key extends string,
>(
	mutableAtomFamily: MutableAtomFamily<Core, SerializableCore, Key>,
	store: Store,
): WritableSelectorFamily<SerializableCore, Key> => {
	const target = newest(store)
	const key = `${mutableAtomFamily.key}:JSON`
	const jsonFamily: WritableSelectorFamily<SerializableCore, Key> =
		target.families.get(key) as WritableSelectorFamily<SerializableCore, Key>
	return jsonFamily
}
