import type {
	RegularAtomFamilyToken,
	TransactionOutcomeEvent,
	TransactionUpdateContent,
} from "atom.io"
import { atomFamily } from "atom.io"

import type { UserKey } from "./server-user-store"

// export const completeUpdateAtoms = atomFamily<
// 	TransactionUpdate<any> | null,
// 	string
// >({
// 	key: `completeUpdate`,
// 	default: null,
// })

export function redactTransactionUpdateContent(
	visibleStateKeys: string[],
	updates: TransactionUpdateContent[],
): TransactionUpdateContent[] {
	return updates
		.map((update): TransactionUpdateContent => {
			switch (update.type) {
				case `transaction_outcome`: {
					const redacted = redactTransactionUpdateContent(
						visibleStateKeys,
						update.updates,
					)
					return { ...update, updates: redacted }
				}
				case `atom_update`:
				case `molecule_creation`:
				case `molecule_disposal`:
				case `molecule_transfer`:
				case `state_creation`:
				case `state_disposal`:
					return update
			}
		})
		.filter((update) => {
			switch (update.type) {
				case `atom_update`:
					return visibleStateKeys.includes(update.key)
				case `state_creation`:
				case `state_disposal`:
					return visibleStateKeys.includes(update.token.key)
				case `molecule_creation`:
				case `transaction_outcome`:
				case `molecule_disposal`:
				case `molecule_transfer`:
					return true
			}
		})
}

export const redactorAtoms: RegularAtomFamilyToken<
	{
		occlude: (updates: TransactionUpdateContent[]) => TransactionUpdateContent[]
	},
	UserKey
> = atomFamily<
	{
		occlude: (updates: TransactionUpdateContent[]) => TransactionUpdateContent[]
	},
	UserKey
>({
	key: `redactor`,
	default: { occlude: (updates) => updates },
})
// export const redactedUpdateSelectors = selectorFamily<
// 	TransactionUpdate<any> | null,
// 	[transactionKey: string, updateId: string]
// >({
// 	key: `redactedUpdate`,
// 	get:
// 		([transactionKey, updateId]) =>
// 		({ get, find }) => {
// 			const update = get(find(completeUpdateAtoms, updateId))
// 			const { filter } = get(find(transactionRedactorAtoms, transactionKey))

// 			if (update && filter) {
// 				return { ...update, updates: filter(update.updates) }
// 			}
// 			return null
// 		},
// })

export type ContinuitySyncTransactionUpdate = Pick<
	TransactionOutcomeEvent<any>,
	`epoch` | `id` | `key` | `output` | `updates`
>
export const userUnacknowledgedQueues: RegularAtomFamilyToken<
	ContinuitySyncTransactionUpdate[],
	UserKey
> = atomFamily<ContinuitySyncTransactionUpdate[], UserKey>({
	key: `unacknowledgedUpdates`,
	default: () => [],
})
