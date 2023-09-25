import type { ReadonlySelectorToken, TransactionToken, ƒn } from "atom.io"
import type { Store } from "atom.io/internal"
import { IMPLICIT, createAtom, createSelector } from "atom.io/internal"

export const attachTransactionIndex = (
	store: Store = IMPLICIT.STORE,
): ReadonlySelectorToken<TransactionToken<ƒn>[]> => {
	const transactionTokenIndexState__INTERNAL = createAtom<
		TransactionToken<ƒn>[]
	>(
		{
			key: `👁‍🗨 Transaction Token Index (Internal)`,
			default: () =>
				[...store.transactions].map(([key]): TransactionToken<ƒn> => {
					return { key, type: `transaction` }
				}),
			effects: [
				({ setSelf }) => {
					store.subject.transactionCreation.subscribe(
						`introspection`,
						(transactionToken) => {
							setSelf((state) => [...state, transactionToken])
						},
					)
				},
			],
		},
		undefined,
		store,
	)
	const transactionTokenIndex = createSelector(
		{
			key: `👁‍🗨 Transaction Token Index`,
			get: ({ get }) => get(transactionTokenIndexState__INTERNAL),
		},
		undefined,
		store,
	)
	return transactionTokenIndex
}
