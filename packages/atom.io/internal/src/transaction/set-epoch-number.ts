import type { Store } from "../store"
import { isRootStore } from "./is-root-store"

export function setEpochNumberOfContinuity(
	continuityKey: string,
	newEpoch: number,
	store: Store,
): void {
	const isRoot = isRootStore(store)
	if (isRoot && continuityKey) {
		store.transactionMeta.epoch.set(continuityKey, newEpoch)
	}
}

export function setEpochNumberOfAction(
	transactionKey: string,
	newEpoch: number,
	store: Store,
): void {
	const isRoot = isRootStore(store)
	if (!isRoot) {
		return
	}
	const continuityKey =
		store.transactionMeta.actionContinuities.getRelatedKey(transactionKey)

	if (continuityKey !== undefined) {
		store.transactionMeta.epoch.set(continuityKey, newEpoch)
		console.log(`epoch is now`, newEpoch)
	}
}
