import type {
	MutableAtomToken,
	WritablePureSelectorFamilyToken,
	WritablePureSelectorToken,
} from "atom.io"

import { findInStore } from "../families"
import { newest } from "../lineage"
import { type Store, withdraw } from "../store"
import type { AsJSON, Transceiver } from "./transceiver"

export const getJsonToken = <T extends Transceiver<any, any>>(
	store: Store,
	mutableAtomToken: MutableAtomToken<T>,
): WritablePureSelectorToken<AsJSON<T>> => {
	if (mutableAtomToken.family) {
		const target = newest(store)
		const jsonFamilyKey = `${mutableAtomToken.family.key}:JSON`
		const jsonFamilyToken: WritablePureSelectorFamilyToken<
			AsJSON<T>,
			string
		> = {
			key: jsonFamilyKey,
			type: `writable_pure_selector_family`,
		}
		const family = withdraw(target, jsonFamilyToken)
		const subKey = JSON.parse(mutableAtomToken.family.subKey)
		const jsonToken = findInStore(store, family, subKey)
		return jsonToken
	}
	const token: WritablePureSelectorToken<AsJSON<T>> = {
		type: `writable_pure_selector`,
		key: `${mutableAtomToken.key}:JSON`,
	}
	return token
}
