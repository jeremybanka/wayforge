import type { ReadonlySelectorFamilyToken, TransactionUpdate } from "atom.io"
import type { Func, Store } from "atom.io/internal"
import {
	createRegularAtomFamily,
	createSelectorFamily,
	IMPLICIT,
} from "atom.io/internal"

export const attachTransactionLogs = (
	store: Store = IMPLICIT.STORE,
): ReadonlySelectorFamilyToken<TransactionUpdate<Func>[], string> => {
	const transactionUpdateLogAtoms = createRegularAtomFamily<
		TransactionUpdate<Func>[],
		string
	>(store, {
		key: `👁‍🗨 Transaction Update Log (Internal)`,
		default: () => [],
		effects: (key) => [
			({ setSelf }) => {
				const tx = store.transactions.get(key)
				tx?.subject.subscribe(`introspection`, (transactionUpdate) => {
					if (transactionUpdate.key === key) {
						setSelf((state) => [...state, transactionUpdate])
					}
				})
			},
		],
	})
	const findTransactionUpdateLogState = createSelectorFamily<
		TransactionUpdate<Func>[],
		string
	>(
		{
			key: `👁‍🗨 Transaction Update Log`,
			get:
				(key) =>
				({ get }) =>
					get(transactionUpdateLogAtoms, key),
		},
		store,
	)
	return findTransactionUpdateLogState
}
