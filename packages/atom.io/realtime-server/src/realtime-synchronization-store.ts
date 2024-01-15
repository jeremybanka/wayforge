import * as AtomIO from "atom.io"

export const completeUpdateAtoms = AtomIO.atomFamily<
	AtomIO.TransactionUpdate<any> | null,
	string
>({
	key: `completeUpdate`,
	default: null,
})

export const transactionRedactorAtoms = AtomIO.atomFamily<
	{
		filter: (
			updates: AtomIO.TransactionUpdateContent[],
		) => AtomIO.TransactionUpdateContent[]
	},
	string
>({
	key: `transactionRedactor`,
	default: { filter: (updates) => updates },
})

export const redactedUpdateSelectors = AtomIO.selectorFamily<
	AtomIO.TransactionUpdate<any> | null,
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

export const clientLastUpdatedAtoms = AtomIO.atomFamily<number | null, string>({
	key: `clientLastUpdated`,
	default: null,
})

export const unconfirmedUpdatesState = AtomIO.atomFamily<
	AtomIO.TransactionUpdate<any>[],
	string
>({
	key: `unconfirmedUpdates`,
	default: [],
})
