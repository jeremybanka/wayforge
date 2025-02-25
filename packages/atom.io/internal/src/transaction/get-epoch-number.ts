import type { Store } from "../store"
import { isRootStore } from "./is-root-store"

export function getContinuityKey(
	store: Store,
	transactionKey: string,
): string | undefined {
	const isRoot = isRootStore(store)
	const continuity = isRoot
		? store.transactionMeta.actionContinuities.getRelatedKey(transactionKey)
		: undefined
	return continuity
}

export function getEpochNumberOfContinuity(
	store: Store,
	continuityKey: string,
): number | undefined {
	const isRoot = isRootStore(store)
	const epoch =
		isRoot && continuityKey
			? store.transactionMeta.epoch.get(continuityKey)
			: undefined
	return epoch
}

export function getEpochNumberOfAction(
	store: Store,
	transactionKey: string,
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
