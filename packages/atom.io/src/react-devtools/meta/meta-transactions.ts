import type { ReadonlySelectorToken, TransactionToken } from "../.."
import { selector, atom } from "../.."
import type { Store } from "../../internal/store"
import { IMPLICIT } from "../../internal/store"

export type TransactionTokenIndex = TransactionToken<unknown>[]

export const attachMetaTransactions = (
	store: Store = IMPLICIT.STORE,
): ReadonlySelectorToken<TransactionTokenIndex> => {
	const transactionTokenIndexState__INTERNAL = atom<TransactionTokenIndex>({
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
	})
	return selector({
		key: `👁‍🗨 Transaction Token Index`,
		get: ({ get }) => get(transactionTokenIndexState__INTERNAL),
	})
}
