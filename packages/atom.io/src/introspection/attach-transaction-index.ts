import type { AtomToken, TransactionToken } from "atom.io"
import type { Fn, Store } from "atom.io/internal"
import { createRegularAtom, isReservedIntrospectionKey } from "atom.io/internal"

export const attachTransactionIndex = (
	store: Store,
): AtomToken<TransactionToken<Fn>[]> => {
	return createRegularAtom<TransactionToken<Fn>[]>(
		store,
		{
			key: `🔍 Transaction Token Index`,
			default: () => {
				const tokens: TransactionToken<Fn>[] = []
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
