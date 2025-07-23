import type { AtomToken, TransactionToken } from "atom.io"
import type { Func, Store } from "atom.io/internal"
import { createRegularAtom, isReservedIntrospectionKey } from "atom.io/internal"

export const attachTransactionIndex = (
	store: Store,
): AtomToken<TransactionToken<Func>[]> => {
	return createRegularAtom<TransactionToken<Func>[]>(
		store,
		{
			key: `🔍 Transaction Token Index`,
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
}
