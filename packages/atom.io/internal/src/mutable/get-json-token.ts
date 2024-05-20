import type {
	MutableAtomToken,
	WritableSelectorFamilyToken,
	WritableSelectorToken,
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
	mutableAtomToken: MutableAtomToken<Core, SerializableCore>,
	store: Store,
): WritableSelectorToken<SerializableCore> => {
	if (mutableAtomToken.family) {
		const target = newest(store)
		const jsonFamilyKey = `${mutableAtomToken.family.key}:JSON`
		const jsonFamilyToken: WritableSelectorFamilyToken<
			SerializableCore,
			string
		> = {
			key: jsonFamilyKey,
			type: `selector_family`,
		}
		const family = withdraw(jsonFamilyToken, target)
		const subKey = JSON.parse(mutableAtomToken.family.subKey)
		const jsonToken = findInStore(family, subKey, store)
		return jsonToken
	}
	const token: WritableSelectorToken<SerializableCore> = {
		type: `selector`,
		key: `${mutableAtomToken.key}:JSON`,
	}
	return token
}
