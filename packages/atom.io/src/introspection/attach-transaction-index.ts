import type { ReadonlyPureSelectorToken, TransactionToken } from "atom.io"
import type { Func, Store } from "atom.io/internal"
import {
	createRegularAtom,
	createStandaloneSelector,
	isReservedIntrospectionKey,
} from "atom.io/internal"

export const attachTransactionIndex = (
	store: Store,
): ReadonlyPureSelectorToken<TransactionToken<Func>[]> => {
	const transactionTokenIndexState__INTERNAL = createRegularAtom<
		TransactionToken<Func>[]
	>(
		store,
		{
			key: `🔍 Transaction Token Index (Internal)`,
			default: () => {
				const tokens: TransactionToken<Func>[] = []
				for (const [key] of store.transactions) {
					if (isReservedIntrospectionKey(key)) {
						continue
					}
					tokens.push({ key, type: `transaction` })
				}
				return tokens
			},
			effects: [
				({ setSelf }) => {
					store.on.transactionCreation.subscribe(
						`introspection`,
						(transactionToken) => {
							if (isReservedIntrospectionKey(transactionToken.key)) {
								return
							}
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
