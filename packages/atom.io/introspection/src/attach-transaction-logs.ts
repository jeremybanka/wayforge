import type { ReadonlySelectorFamily, TransactionUpdate, ƒn } from "atom.io"
import { __INTERNAL__ } from "atom.io"

export const attachTransactionLogs = (
	store: __INTERNAL__.Store = __INTERNAL__.IMPLICIT.STORE,
): ReadonlySelectorFamily<TransactionUpdate<ƒn>[]> => {
	const findTransactionUpdateLog = __INTERNAL__.atomFamily__INTERNAL<
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
	const findTransactionUpdateLogState = __INTERNAL__.selectorFamily__INTERNAL<
		TransactionUpdate<ƒn>[],
		string
	>(
		{
			key: `👁‍🗨 Transaction Update Log`,
			get: (key) => ({ get }) => get(findTransactionUpdateLog(key)),
		},
		store,
	)
	return findTransactionUpdateLogState
}
