import type { MutableAtomFamilyToken } from "atom.io"
import type { Canonical, Json } from "atom.io/json"

import type { WritableSelectorFamily } from ".."
import { newest } from "../lineage"
import type { Store } from "../store"
import type { Transceiver } from "./transceiver"

export const getJsonFamily = <
	Core extends Transceiver<Json.Serializable>,
	SerializableCore extends Json.Serializable,
	Key extends Canonical,
>(
	store: Store,
	mutableAtomFamily: MutableAtomFamilyToken<Core, SerializableCore, Key>,
): WritableSelectorFamily<SerializableCore, Key> => {
	const target = newest(store)
	const key = `${mutableAtomFamily.key}:JSON`
	const jsonFamily: WritableSelectorFamily<SerializableCore, Key> =
		target.families.get(key) as WritableSelectorFamily<SerializableCore, Key>
	return jsonFamily
}
