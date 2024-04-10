import type {
	ReadonlySelectorFamilyToken,
	TransactionUpdate,
	Func,
} from "atom.io"
import type { Store } from "atom.io/internal"
import {
	IMPLICIT,
	createRegularAtomFamily,
	createSelectorFamily,
} from "atom.io/internal"

export const attachTransactionLogs = (
	store: Store = IMPLICIT.STORE,
): ReadonlySelectorFamilyToken<TransactionUpdate<Func>[], string> => {
	const findTransactionUpdateLog = createRegularAtomFamily<
		TransactionUpdate<Func>[],
		string
	>(
		{
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
		},
		store,
	)
	const findTransactionUpdateLogState = createSelectorFamily<
		TransactionUpdate<Func>[],
		string
	>(
		{
			key: `👁‍🗨 Transaction Update Log`,
			get:
				(key) =>
				({ get }) =>
					get(findTransactionUpdateLog(key)),
		},
		store,
	)
	return findTransactionUpdateLogState
}
