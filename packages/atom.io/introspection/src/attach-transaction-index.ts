import type { ReadonlySelectorToken, TransactionToken } from "atom.io"
import type { Func, Store } from "atom.io/internal"
import {
	createRegularAtom,
	createStandaloneSelector,
	IMPLICIT,
} from "atom.io/internal"

export const attachTransactionIndex = (
	store: Store = IMPLICIT.STORE,
): ReadonlySelectorToken<TransactionToken<Func>[]> => {
	const transactionTokenIndexState__INTERNAL = createRegularAtom<
		TransactionToken<Func>[]
	>(
		store,
		{
			key: `👁‍🗨 Transaction Token Index (Internal)`,
			default: () =>
				[...store.transactions].map(([key]): TransactionToken<Func> => {
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
	)
	const transactionTokenIndex = createStandaloneSelector(
		{
			key: `👁‍🗨 Transaction Token Index`,
			get: ({ get }) => get(transactionTokenIndexState__INTERNAL),
		},
		store,
	)
	return transactionTokenIndex
}
