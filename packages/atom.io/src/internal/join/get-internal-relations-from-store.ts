import type { JoinToken, MutableAtomFamilyToken } from "atom.io"
import type { UList } from "atom.io/transceivers/u-list"

import type { RootStore } from "../transaction"
import { getJoin } from "./get-join"

export function getInternalRelationsFromStore<
	AName extends string,
	BName extends string,
>(
	token: JoinToken<any, AName, any, BName, any>,
	store: RootStore,
): MutableAtomFamilyToken<UList<AName> | UList<BName>, string> {
	const myJoin = getJoin(token, store)
	const family = myJoin.relatedKeysAtoms as MutableAtomFamilyToken<
		UList<AName> | UList<BName>,
		string
	>
	return family
}
