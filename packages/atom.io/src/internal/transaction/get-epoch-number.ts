import type { Store } from "../store"
import type { RootStore } from "./is-root-store"
import { isRootStore } from "./is-root-store"

export function getContinuityKey(
	store: RootStore,
	transactionKey: string,
): string | undefined {
	const continuity =
		store.transactionMeta.actionContinuities.getRelatedKey(transactionKey)

	return continuity
}

export function getEpochNumberOfContinuity(
	store: RootStore,
	continuityKey: string,
): number | undefined {
	const epoch = store.transactionMeta.epoch.get(continuityKey)
	return epoch
}

export function getEpochNumberOfAction(
	store: Store,
	transactionKey: string,
): number | undefined {
	const isRoot = isRootStore(store)
	if (!isRoot) {
		return undefined
	}
	const continuityKey = getContinuityKey(store, transactionKey)
	if (continuityKey === undefined) {
		return undefined
	}
	return getEpochNumberOfContinuity(store, continuityKey)
}
