import type { ReadonlySelectorFamily, TransactionUpdate } from "atom.io"
import { __INTERNAL__ } from "atom.io"

import type { ƒn } from "~/packages/anvl/src/function"

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
					tx.subject.subscribe((transactionUpdate) => {
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
