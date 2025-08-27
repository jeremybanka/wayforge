import type { JoinToken, MutableAtomFamilyToken } from "atom.io"
import type { SetRTX } from "atom.io/transceivers/set-rtx"

import type { RootStore } from "../transaction"
import { getJoin } from "./get-join"

export function getInternalRelationsFromStore(
	token: JoinToken<any, any, any, any, any, any>,
	store: RootStore,
): MutableAtomFamilyToken<SetRTX<string>, string> {
	const myJoin = getJoin(token, store)
	const family = myJoin.core.relatedKeysAtoms
	return family
}
