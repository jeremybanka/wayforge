import type { Store } from "../store"
import { isRootStore } from "./is-root-store"

export function getEpochNumber(
	transactionKey: string,
	store: Store,
): number | undefined {
	const isRoot = isRootStore(store)
	const continuity = isRoot
		? store.transactionMeta.epochActions.getRelatedKey(transactionKey)
		: undefined
	const epoch =
		isRoot && continuity
			? store.transactionMeta.epoch.get(continuity)
			: undefined
	return epoch
}
