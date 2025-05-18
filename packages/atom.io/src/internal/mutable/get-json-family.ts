import type { MutableAtomFamilyToken } from "atom.io"
import type { Canonical, Json } from "atom.io/json"

import type { WritablePureSelectorFamily } from ".."
import { newest } from "../lineage"
import type { Store } from "../store"
import type { Transceiver } from "./transceiver"

export const getJsonFamily = <
	Core extends Transceiver<Json.Serializable>,
	SerializableCore extends Json.Serializable,
	Key extends Canonical,
>(
	mutableAtomFamily: MutableAtomFamilyToken<Core, SerializableCore, Key>,
	store: Store,
): WritablePureSelectorFamily<SerializableCore, Key> => {
	const target = newest(store)
	const key = `${mutableAtomFamily.key}:JSON`
	const jsonFamily: WritablePureSelectorFamily<SerializableCore, Key> =
		target.families.get(key) as WritablePureSelectorFamily<SerializableCore, Key>
	return jsonFamily
}
