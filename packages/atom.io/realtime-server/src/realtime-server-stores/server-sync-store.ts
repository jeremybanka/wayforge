import type { TransactionUpdate, TransactionUpdateContent } from "atom.io"
import { atomFamily, selectorFamily } from "atom.io"

export const completeUpdateAtoms = atomFamily<
	TransactionUpdate<any> | null,
	string
>({
	key: `completeUpdate`,
	default: null,
})

export const transactionRedactorAtoms = atomFamily<
	{
		filter: (updates: TransactionUpdateContent[]) => TransactionUpdateContent[]
	},
	string
>({
	key: `transactionRedactor`,
	default: { filter: (updates) => updates },
})

export const redactedUpdateSelectors = selectorFamily<
	TransactionUpdate<any> | null,
	[transactionKey: string, updateId: string]
>({
	key: `redactedUpdate`,
	get:
		([transactionKey, updateId]) =>
		({ get, find }) => {
			const update = get(find(completeUpdateAtoms, updateId))
			const { filter } = get(find(transactionRedactorAtoms, transactionKey))

			if (update && filter) {
				return { ...update, updates: filter(update.updates) }
			}
			return null
		},
})

export const unconfirmedUpdatesState = atomFamily<
	TransactionUpdate<any>[],
	string
>({
	key: `unconfirmedUpdates`,
	default: [],
})

export const roomEpochAtoms = atomFamily<number, string>({
	key: `roomEpoch`,
	default: 0,
})

export const clientLastUpdatedAtoms = atomFamily<number | null, string>({
	key: `clientLastUpdated`,
	default: null,
})
