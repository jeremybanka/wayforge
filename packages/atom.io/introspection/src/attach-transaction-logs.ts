import type { ReadonlySelectorFamily, TransactionUpdate, ƒn } from "atom.io"
import type { Store } from "atom.io/internal"
import {
	IMPLICIT,
	createAtomFamily,
	createSelectorFamily,
} from "atom.io/internal"

export const attachTransactionLogs = (
	store: Store = IMPLICIT.STORE,
): ReadonlySelectorFamily<TransactionUpdate<ƒn>[]> => {
	const findTransactionUpdateLog = createAtomFamily<
		TransactionUpdate<ƒn>[],
		string
	>(
		{
			key: `👁‍🗨 Transaction Update Log (Internal)`,
			default: () => [],
			effects: (key) => [
				({ setSelf }) => {
					const tx = store.transactions.get(key)
					tx?.subject.subscribe(`introspection`, (transactionUpdate) => {
						if (transactionUpdate.key === key) {
							setSelf((state) => [...state, transactionUpdate])
						}
					})
				},
			],
		},
		store,
	)
	const findTransactionUpdateLogState = createSelectorFamily<
		TransactionUpdate<ƒn>[],
		string
	>(
		{
			key: `👁‍🗨 Transaction Update Log`,
			get:
				(key) =>
				({ get }) =>
					get(findTransactionUpdateLog(key)),
		},
		store,
	)
	return findTransactionUpdateLogState
}
