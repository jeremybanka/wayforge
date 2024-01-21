import type { ƒn } from "atom.io"

import type { TransactionEpoch, TransactionProgress } from "."
import type { Store } from "../store"

export interface RootStore extends Store {
	transactionMeta: TransactionEpoch
	parent: null
	child: ChildStore | null
}
export interface ChildStore extends Store {
	transactionMeta: TransactionProgress<ƒn>
	parent: ChildStore | RootStore
	child: ChildStore | null
}

export function isRootStore(store: Store): store is RootStore {
	return `epoch` in store.transactionMeta
}

export function isChildStore(store: Store): store is ChildStore {
	return `phase` in store.transactionMeta
}
