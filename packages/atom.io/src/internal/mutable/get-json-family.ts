import type { MutableAtomFamilyToken } from "atom.io"
import type { Canonical, Json } from "atom.io/json"

import type { WritablePureSelectorFamily } from ".."
import { newest } from "../lineage"
import type { Store } from "../store"
import type { Transceiver } from "./transceiver"

export const getJsonFamily = <
	Core extends Transceiver<Json.Serializable, Json.Serializable>,
	Key extends Canonical,
>(
	mutableAtomFamily: MutableAtomFamilyToken<Core, Key>,
	store: Store,
): WritablePureSelectorFamily<ReturnType<Core[`toJSON`]>, Key> => {
	const target = newest(store)
	const key = `${mutableAtomFamily.key}:JSON`
	const jsonFamily = target.families.get(key) as WritablePureSelectorFamily<
		ReturnType<Core[`toJSON`]>,
		Key
	>
	return jsonFamily
}
