import type { MutableAtomFamilyToken } from "atom.io"
import type { Canonical, Json } from "atom.io/json"

import type { WritableTransientSelectorFamily } from ".."
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
): WritableTransientSelectorFamily<SerializableCore, Key> => {
	const target = newest(store)
	const key = `${mutableAtomFamily.key}:JSON`
	const jsonFamily: WritableTransientSelectorFamily<SerializableCore, Key> =
		target.families.get(key) as WritableTransientSelectorFamily<
			SerializableCore,
			Key
		>
	return jsonFamily
}
