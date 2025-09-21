import type { JoinToken } from "atom.io"

import type { Junction } from "../junction"
import { newest } from "../lineage"
import type { Store } from "../store"
import { isChildStore } from "../transaction"
import { getJoin } from "./get-join"

export function editRelationsInStore<
	ASide extends string,
	AType extends string,
	BSide extends string,
	BType extends string,
	Cardinality extends `1:1` | `1:n` | `n:n`,
>(
	token: JoinToken<ASide, AType, BSide, BType, Cardinality>,
	change: (relations: Junction<ASide, AType, BSide, BType>) => void,
	store: Store,
): void {
	const myJoin = getJoin(token, store)
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
