import type { JoinToken, MutableAtomFamilyToken } from "atom.io"
import type { UList } from "atom.io/transceivers/u-list"

import type { RootStore } from "../transaction"
import { getJoin } from "./get-join"

export function getInternalRelationsFromStore<
	A extends string,
	B extends string,
>(
	token: JoinToken<any, A, any, B, any>,
	store: RootStore,
): MutableAtomFamilyToken<UList<A> | UList<B>, A | B> {
	const myJoin = getJoin(token, store)
	return myJoin.relatedKeysAtoms
}
