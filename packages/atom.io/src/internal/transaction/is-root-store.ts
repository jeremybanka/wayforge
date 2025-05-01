import type { Store } from "../store"
import type { Func } from "../utility-types"
import type { TransactionEpoch, TransactionProgress } from "."

export interface RootStore extends Store {
	transactionMeta: TransactionEpoch
	parent: null
	child: ChildStore | null
}
export interface ChildStore extends Store {
	transactionMeta: TransactionProgress<Func>
	parent: ChildStore | RootStore
	child: ChildStore | null
}

export function isRootStore(store: Store): store is RootStore {
	return `epoch` in store.transactionMeta
}

export function isChildStore(store: Store): store is ChildStore {
	return `phase` in store.transactionMeta
}
