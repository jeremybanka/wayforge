import type { JoinToken, MutableAtomFamilyToken } from "atom.io"
import type { UList } from "atom.io/transceivers/u-list"

import type { RootStore } from "../transaction"
import { getJoin } from "./get-join"

export function getInternalRelationsFromStore<
	AType extends string,
	BType extends string,
>(
	token: JoinToken<any, AType, any, BType, any>,
	store: RootStore,
): MutableAtomFamilyToken<UList<AType> | UList<BType>, string> {
	const myJoin = getJoin(token, store)
	const family = myJoin.core.relatedKeysAtoms as MutableAtomFamilyToken<
		UList<AType> | UList<BType>,
		string
	>
	return family
}
