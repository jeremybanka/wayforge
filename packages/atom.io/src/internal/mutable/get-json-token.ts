import type {
	MutableAtomToken,
	WritablePureSelectorFamilyToken,
	WritablePureSelectorToken,
} from "atom.io"

import { findInStore } from "../families"
import { newest } from "../lineage"
import { type Store, withdraw } from "../store"
import type { Transceiver } from "./transceiver"

export const getJsonToken = <Core extends Transceiver<any, any>>(
	store: Store,
	mutableAtomToken: MutableAtomToken<Core>,
): WritablePureSelectorToken<ReturnType<Core[`toJSON`]>> => {
	if (mutableAtomToken.family) {
		const target = newest(store)
		const jsonFamilyKey = `${mutableAtomToken.family.key}:JSON`
		const jsonFamilyToken: WritablePureSelectorFamilyToken<
			ReturnType<Core[`toJSON`]>,
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
	const token: WritablePureSelectorToken<ReturnType<Core[`toJSON`]>> = {
		type: `writable_pure_selector`,
		key: `${mutableAtomToken.key}:JSON`,
	}
	return token
}
