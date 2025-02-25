import type { JoinToken, MutableAtomFamilyToken } from "atom.io"
import type { SetRTX, SetRTXJson } from "atom.io/transceivers/set-rtx"

import type { Store } from "../store"
import { getJoin } from "./get-join"

export function getInternalRelationsFromStore(
	token: JoinToken<any, any, any, any, any, any>,
	store: Store,
): MutableAtomFamilyToken<SetRTX<string>, SetRTXJson<string>, string> {
	const myJoin = getJoin(token, store)
	const family = myJoin.core.relatedKeysAtoms
	return family
}
