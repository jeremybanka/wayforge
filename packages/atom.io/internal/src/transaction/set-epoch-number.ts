import type { Store } from "../store"
import { getContinuityKey } from "./get-epoch-number"
import { isRootStore } from "./is-root-store"

export function setEpochNumberOfContinuity(
	store: Store,
	continuityKey: string,
	newEpoch: number,
): void {
	const isRoot = isRootStore(store)
	if (isRoot && continuityKey) {
		store.transactionMeta.epoch.set(continuityKey, newEpoch)
	}
}

export function setEpochNumberOfAction(
	store: Store,
	transactionKey: string,
	newEpoch: number,
): void {
	const isRoot = isRootStore(store)
	if (!isRoot) {
		return
	}
	const continuityKey = getContinuityKey(store, transactionKey)

	if (continuityKey !== undefined) {
		store.transactionMeta.epoch.set(continuityKey, newEpoch)
	}
}
