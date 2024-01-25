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
	const continuityKey = isRoot
		? store.transactionMeta.actionContinuities.getRelatedKey(transactionKey)
		: undefined

	if (isRoot && continuityKey) {
		store.transactionMeta.epoch.set(continuityKey, newEpoch)
	}
}
