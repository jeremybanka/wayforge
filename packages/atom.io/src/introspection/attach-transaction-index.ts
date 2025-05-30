import type { ReadonlyPureSelectorToken, TransactionToken } from "atom.io"
import type { Func, Store } from "atom.io/internal"
import { createRegularAtom, createStandaloneSelector } from "atom.io/internal"

export const attachTransactionIndex = (
	store: Store,
): ReadonlyPureSelectorToken<TransactionToken<Func>[]> => {
	const transactionTokenIndexState__INTERNAL = createRegularAtom<
		TransactionToken<Func>[]
	>(
		store,
		{
			key: `🔍 Transaction Token Index (Internal)`,
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
	const transactionTokenIndex = createStandaloneSelector(store, {
		key: `🔍 Transaction Token Index`,
		get: ({ get }) => get(transactionTokenIndexState__INTERNAL),
	})
	return transactionTokenIndex
}
