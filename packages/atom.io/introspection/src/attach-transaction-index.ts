import type { ReadonlySelectorToken, TransactionToken, ƒn } from "atom.io"
import type { Store } from "atom.io/internal"
import {
	IMPLICIT,
	createRegularAtom,
	createStandaloneSelector,
} from "atom.io/internal"

export const attachTransactionIndex = (
	store: Store = IMPLICIT.STORE,
): ReadonlySelectorToken<TransactionToken<ƒn>[]> => {
	const transactionTokenIndexStateInternal = createRegularAtom<
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
					store.on.transactionCreation.subscribe(
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
	const transactionTokenIndex = createStandaloneSelector(
		{
			key: `👁‍🗨 Transaction Token Index`,
			get: ({ get }) => get(transactionTokenIndexStateInternal),
		},
		store,
	)
	return transactionTokenIndex
}
