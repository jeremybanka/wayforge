import type { ƒn } from "~/packages/anvl/src/function"

import type {
	ReadonlySelectorFamily,
	ReadonlySelectorToken,
	TransactionToken,
	TransactionUpdate,
} from "../.."
import { selector, atom } from "../.."
import {
	atomFamily__INTERNAL,
	selectorFamily__INTERNAL,
	selector__INTERNAL,
} from "../../internal"
import type { Store } from "../../internal/store"
import { IMPLICIT } from "../../internal/store"

export const attachMetaTransactions = (
	store: Store = IMPLICIT.STORE,
): ReadonlySelectorToken<TransactionToken<unknown>[]> => {
	const transactionTokenIndexState__INTERNAL = atom<TransactionToken<unknown>[]>(
		{
			key: `👁‍🗨 Transaction Token Index (Internal)`,
			default: () =>
				[...store.transactions].map(([key]) => {
					return { key, type: `transaction` }
				}),
			effects: [
				({ setSelf }) => {
					store.subject.transactionCreation.subscribe((transactionToken) => {
						setSelf((state) => [...state, transactionToken])
					})
				},
			],
		},
	)
	const transactionTokenIndex = selector__INTERNAL(
		{
			key: `👁‍🗨 Transaction Token Index`,
			get: ({ get }) => get(transactionTokenIndexState__INTERNAL),
		},
		undefined,
		store,
	)
	return transactionTokenIndex
}
export const attachMetaTransactionUpdateLog = (
	store: Store = IMPLICIT.STORE,
): ReadonlySelectorFamily<TransactionUpdate<ƒn>[]> => {
	const findTransactionUpdateLog = atomFamily__INTERNAL<
		TransactionUpdate<ƒn>[],
		string
	>({
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
	})
	const findTransactionUpdateLogState = selectorFamily__INTERNAL<
		TransactionUpdate<ƒn>[],
		string
	>({
		key: `👁‍🗨 Transaction Update Log`,
		get: (key) => ({ get }) => get(findTransactionUpdateLog(key)),
	})
	return findTransactionUpdateLogState
}
