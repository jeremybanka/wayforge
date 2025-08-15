import type {
	RegularAtomFamilyToken,
	TransactionEvent,
	TransactionOutcomeEvent,
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
	updates: TransactionEvent[],
): TransactionEvent[] {
	return updates
		.map((update): TransactionEvent => {
			switch (update.type) {
				case `transaction_update`: {
					const redacted = redactTransactionUpdateContent(
						visibleStateKeys,
						update.events,
					)
					return { ...update, events: redacted }
				}
				case `update`:
				case `molecule_creation`:
				case `molecule_disposal`:
				case `molecule_transfer`:
				case `creation`:
				case `disposal`:
					return update
			}
		})
		.filter((update) => {
			switch (update.type) {
				case `update`:
					return visibleStateKeys.includes(update.token.key)
				case `creation`:
				case `disposal`:
					return visibleStateKeys.includes(update.token.key)
				case `molecule_creation`:
				case `transaction_update`:
				case `molecule_disposal`:
				case `molecule_transfer`:
					return true
			}
		})
}

export const redactorAtoms: RegularAtomFamilyToken<
	{
		occlude: (updates: TransactionEvent[]) => TransactionEvent[]
	},
	UserKey
> = atomFamily<
	{
		occlude: (updates: TransactionEvent[]) => TransactionEvent[]
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
	`epoch` | `events` | `id` | `output` | `token`
>
export const userUnacknowledgedQueues: RegularAtomFamilyToken<
	ContinuitySyncTransactionUpdate[],
	UserKey
> = atomFamily<ContinuitySyncTransactionUpdate[], UserKey>({
	key: `unacknowledgedUpdates`,
	default: () => [],
})
