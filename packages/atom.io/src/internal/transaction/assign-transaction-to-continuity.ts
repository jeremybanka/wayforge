import type { RootStore } from "./is-root-store"

export function assignTransactionToContinuity(
	store: RootStore,
	continuityKey: string,
	transactionKey: string,
): void {
	const { epoch, actionContinuities } = store.transactionMeta
	actionContinuities.set(continuityKey, transactionKey)
	if (!epoch.has(continuityKey)) {
		epoch.set(continuityKey, -1)
	}
}
