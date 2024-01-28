import type { Store } from "../store"
import { isRootStore } from "./is-root-store"

export function getContinuityKey(
	transactionKey: string,
	store: Store,
): string | undefined {
	const isRoot = isRootStore(store)
	const continuity = isRoot
		? store.transactionMeta.actionContinuities.getRelatedKey(transactionKey)
		: undefined
	return continuity
}

export function getEpochNumberOfContinuity(
	continuityKey: string,
	store: Store,
): number | undefined {
	const isRoot = isRootStore(store)
	const epoch =
		isRoot && continuityKey
			? store.transactionMeta.epoch.get(continuityKey)
			: undefined
	return epoch
}

export function getEpochNumberOfAction(
	transactionKey: string,
	store: Store,
): number | undefined {
	const isRoot = isRootStore(store)
	const continuity = isRoot
		? store.transactionMeta.actionContinuities.getRelatedKey(transactionKey)
		: undefined
	const epoch =
		isRoot && continuity !== undefined
			? store.transactionMeta.epoch.get(continuity)
			: undefined
	return epoch
}
