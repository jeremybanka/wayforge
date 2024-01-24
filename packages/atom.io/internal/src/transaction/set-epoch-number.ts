import type { Store } from "../store"
import { isRootStore } from "./is-root-store"

export function setEpochNumber(
	transactionKey: string,
	newEpoch: number,
	store: Store,
): void {
	const isRoot = isRootStore(store)
	if (!isRoot) {
		return
	}
	const continuity = isRoot
		? store.transactionMeta.epochActions.getRelatedKey(transactionKey)
		: undefined

	if (isRoot && continuity) {
		store.transactionMeta.epoch.set(continuity, newEpoch)
	}
}
