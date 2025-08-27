import type {
	ReadonlyPureSelectorFamilyToken,
	TransactionOutcomeEvent,
	TransactionToken,
} from "atom.io"
import type { RootStore } from "atom.io/internal"
import { createRegularAtomFamily, createSelectorFamily } from "atom.io/internal"

export const attachTransactionLogs = (
	store: RootStore,
): ReadonlyPureSelectorFamilyToken<
	TransactionOutcomeEvent<TransactionToken<any>>[],
	string
> => {
	const transactionUpdateLogAtoms = createRegularAtomFamily<
		TransactionOutcomeEvent<TransactionToken<any>>[],
		string
	>(store, {
		key: `🔍 Transaction Update Log (Internal)`,
		default: () => [],
		effects: (key) => [
			({ setSelf }) => {
				const tx = store.transactions.get(key)
				tx?.subject.subscribe(`introspection`, (transactionUpdate) => {
					if (transactionUpdate.token.key === key) {
						setSelf((state) => [...state, transactionUpdate])
					}
				})
			},
		],
	})
	const findTransactionUpdateLogState = createSelectorFamily<
		TransactionOutcomeEvent<TransactionToken<any>>[],
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
