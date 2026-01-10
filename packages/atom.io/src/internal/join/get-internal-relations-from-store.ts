import type { JoinToken, MutableAtomFamilyToken } from "atom.io"
import type { UList } from "atom.io/transceivers/u-list"

import type { Store } from "../store"
import { getJoin } from "./get-join"

export function getInternalRelationsFromStore<
	A extends string,
	B extends string,
>(
	store: Store,
	token: JoinToken<any, A, any, B, any>,
): MutableAtomFamilyToken<UList<A> | UList<B>, A | B>
export function getInternalRelationsFromStore<
	A extends string,
	B extends string,
>(
	store: Store,
	token: JoinToken<any, A, any, B, any>,
	split: `split`,
): [
	atob: MutableAtomFamilyToken<UList<B>, A>,
	btoa: MutableAtomFamilyToken<UList<A>, B>,
]
export function getInternalRelationsFromStore<
	A extends string,
	B extends string,
>(
	store: Store,
	token: JoinToken<any, A, any, B, any>,
	split?: `split`,
):
	| MutableAtomFamilyToken<UList<A> | UList<B>, A | B>
	| [
			atob: MutableAtomFamilyToken<UList<B>, A>,
			btoa: MutableAtomFamilyToken<UList<A>, B>,
	  ] {
	const myJoin = getJoin(store, token)
	if (split === `split`) {
		return [
			myJoin.relatedKeysAtoms as MutableAtomFamilyToken<UList<B>, A>,
			myJoin.relatedKeysAtoms as MutableAtomFamilyToken<UList<A>, B>,
		]
	}
	return myJoin.relatedKeysAtoms
}
