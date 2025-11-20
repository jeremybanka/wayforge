import type { JoinToken } from "atom.io"

import type { Junction } from "../junction"
import { newest } from "../lineage"
import type { Store } from "../store"
import { isChildStore } from "../transaction"
import { getJoin } from "./get-join"

export function editRelationsInStore<
	AName extends string,
	A extends string,
	BName extends string,
	B extends string,
	Cardinality extends `1:1` | `1:n` | `n:n`,
>(
	store: Store,
	token: JoinToken<AName, A, BName, B, Cardinality>,
	change: (relations: Junction<AName, A, BName, B>) => void,
): void {
	const myJoin = getJoin(store, token)
	const target = newest(store)
	if (isChildStore(target)) {
		const { toolkit } = target.transactionMeta
		myJoin.transact(toolkit, ({ relations }) => {
			change(relations)
		})
	} else {
		change(myJoin.relations)
	}
}
