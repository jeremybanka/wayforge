import type { JoinToken } from "atom.io"

import { eldest } from "../lineage"
import type { Store } from "../store"
import { IMPLICIT } from "../store"
import { Join } from "./join-internal"

export function getJoin<
	AName extends string,
	A extends string,
	BName extends string,
	B extends string,
	Cardinality extends `1:1` | `1:n` | `n:n`,
>(
	store: Store,
	token: JoinToken<AName, A, BName, B, Cardinality>,
): Join<AName, A, BName, B, Cardinality> {
	let myJoin = store.joins.get(token.key)
	if (myJoin === undefined) {
		const rootJoinMap = IMPLICIT.STORE.joins
		const rootJoin = rootJoinMap.get(token.key)
		if (rootJoin === undefined) {
			throw new Error(
				`Join "${token.key}" not found in store "${store.config.name}"`,
			)
		}
		const root = eldest(store)
		myJoin = new Join(root, rootJoin.options)
		store.joins.set(token.key, myJoin)
	}
	return myJoin
}
