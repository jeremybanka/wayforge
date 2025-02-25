import type { Store } from "../store"
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
	const continuityKey =
		store.transactionMeta.actionContinuities.getRelatedKey(transactionKey)

	if (continuityKey !== undefined) {
		store.transactionMeta.epoch.set(continuityKey, newEpoch)
	}
}
