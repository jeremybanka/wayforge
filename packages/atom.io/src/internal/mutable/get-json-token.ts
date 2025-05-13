import type {
	MutableAtomToken,
	WritableTransientSelectorFamilyToken,
	WritableTransientSelectorToken,
} from "atom.io"
import type { Json } from "atom.io/json"

import { findInStore } from "../families"
import { newest } from "../lineage"
import { type Store, withdraw } from "../store"
import type { Transceiver } from "./transceiver"

export const getJsonToken = <
	Core extends Transceiver<any>,
	SerializableCore extends Json.Serializable,
>(
	store: Store,
	mutableAtomToken: MutableAtomToken<Core, SerializableCore>,
): WritableTransientSelectorToken<SerializableCore> => {
	if (mutableAtomToken.family) {
		const target = newest(store)
		const jsonFamilyKey = `${mutableAtomToken.family.key}:JSON`
		const jsonFamilyToken: WritableTransientSelectorFamilyToken<
			SerializableCore,
			string
		> = {
			key: jsonFamilyKey,
			type: `writable_transient_selector_family`,
		}
		const family = withdraw(target, jsonFamilyToken)
		const subKey = JSON.parse(mutableAtomToken.family.subKey)
		const jsonToken = findInStore(store, family, subKey)
		return jsonToken
	}
	const token: WritableTransientSelectorToken<SerializableCore> = {
		type: `writable_transient_selector`,
		key: `${mutableAtomToken.key}:JSON`,
	}
	return token
}
