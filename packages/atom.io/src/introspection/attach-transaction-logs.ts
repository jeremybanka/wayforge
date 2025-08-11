import type { ReadonlyPureSelectorFamilyToken, TransactionUpdate } from "atom.io"
import type { Fn, Store } from "atom.io/internal"
import { createRegularAtomFamily, createSelectorFamily } from "atom.io/internal"

export const attachTransactionLogs = (
	store: Store,
): ReadonlyPureSelectorFamilyToken<TransactionUpdate<Fn>[], string> => {
	const transactionUpdateLogAtoms = createRegularAtomFamily<
		TransactionUpdate<Fn>[],
		string
	>(store, {
		key: `🔍 Transaction Update Log (Internal)`,
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
		TransactionUpdate<Fn>[],
		string
	>(store, {
		key: `🔍 Transaction Update Log`,
		get:
			(key) =>
			({ get }) =>
				get(transactionUpdateLogAtoms, key),
	})
	return findTransactionUpdateLogState
}
