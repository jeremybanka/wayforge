import type { ReadonlySelectorToken, TransactionToken, ƒn } from "atom.io"
import { __INTERNAL__ } from "atom.io"

export const attachTransactionIndex = (
	store: __INTERNAL__.Store = __INTERNAL__.IMPLICIT.STORE,
): ReadonlySelectorToken<TransactionToken<ƒn>[]> => {
	const transactionTokenIndexState__INTERNAL = __INTERNAL__.createAtom<
		TransactionToken<ƒn>[]
	>(
		{
			key: `👁‍🗨 Transaction Token Index (Internal)`,
			default: () =>
				[...store.transactions].map(([key]) => {
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
	const transactionTokenIndex = __INTERNAL__.createSelector(
		{
			key: `👁‍🗨 Transaction Token Index`,
			get: ({ get }) => get(transactionTokenIndexState__INTERNAL),
		},
		undefined,
		store,
	)
	return transactionTokenIndex
}
