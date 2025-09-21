import type { JoinToken } from "atom.io"

import { eldest } from "../lineage"
import type { Store } from "../store"
import { IMPLICIT } from "../store"
import { Join } from "./join-internal"

export function getJoin<
	ASide extends string,
	AType extends string,
	BSide extends string,
	BType extends string,
	Cardinality extends `1:1` | `1:n` | `n:n`,
>(
	token: JoinToken<ASide, AType, BSide, BType, Cardinality>,
	store: Store,
): Join<ASide, AType, BSide, BType, Cardinality> {
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
		myJoin = new Join(rootJoin.options, root)
		store.joins.set(token.key, myJoin)
	}
	return myJoin
}
