import type { Store } from "../store"
import { isRootStore } from "./is-root-store"

export function assignTransactionToContinuity(
	continuityKey: string,
	transactionKey: string,
	store: Store,
): void {
	const isRoot = isRootStore(store)
	if (!isRoot) {
		return
	}
	const { epoch, epochActions } = store.transactionMeta
	epochActions.set(continuityKey, transactionKey)
	if (!epoch.has(continuityKey)) {
		epoch.set(continuityKey, -1)
	}
}
