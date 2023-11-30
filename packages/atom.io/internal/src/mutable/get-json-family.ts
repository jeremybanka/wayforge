import type { MutableAtomFamily, SelectorFamily } from "atom.io"
import type { Json } from "atom.io/json"

import type { Store } from "../store"
import { target } from "../transaction"
import type { Transceiver } from "./transceiver"

export const getJsonFamily = <
	Core extends Transceiver<Json.Serializable>,
	SerializableCore extends Json.Serializable,
	Key extends string,
>(
	mutableAtomFamily: MutableAtomFamily<Core, SerializableCore, Key>,
	store: Store,
): SelectorFamily<SerializableCore, Key> => {
	const core = target(store)
	const key = `${mutableAtomFamily.key}:JSON`
	const jsonFamily: SelectorFamily<SerializableCore, Key> = core.families.get(
		key,
	) as SelectorFamily<SerializableCore, Key>
	return jsonFamily
}
