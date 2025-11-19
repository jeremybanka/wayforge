import type { JoinToken, MutableAtomFamilyToken } from "atom.io"
import type { UList } from "atom.io/transceivers/u-list"

import type { RootStore } from "../transaction"
import { getJoin } from "./get-join"

export function getInternalRelationsFromStore<
	A extends string,
	B extends string,
>(
	store: RootStore,
	token: JoinToken<any, A, any, B, any>,
): [
	atob: MutableAtomFamilyToken<UList<B>, A>,
	btoa: MutableAtomFamilyToken<UList<A>, B>,
] {
	const myJoin = getJoin(store, token)
	const atoms = myJoin.relatedKeysAtoms
	return [
		atoms as MutableAtomFamilyToken<UList<B>, A>,
		atoms as MutableAtomFamilyToken<UList<A>, B>,
	]
}
