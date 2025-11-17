import type {
	RegularAtomFamilyToken,
	TransactionOutcomeEvent,
	TransactionSubEvent,
} from "atom.io"
import { atomFamily } from "atom.io"
import type { UserKey } from "atom.io/realtime"

export function redactTransactionUpdateContent(
	visibleStateKeys: string[],
	updates: TransactionSubEvent[],
): TransactionSubEvent[] {
	return updates
		.map((update): TransactionSubEvent => {
			switch (update.type) {
				case `transaction_outcome`: {
					const redacted = redactTransactionUpdateContent(
						visibleStateKeys,
						update.subEvents,
					)
					return { ...update, subEvents: redacted }
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
		occlude: (updates: TransactionSubEvent[]) => TransactionSubEvent[]
	},
	UserKey
> = atomFamily<
	{
		occlude: (updates: TransactionSubEvent[]) => TransactionSubEvent[]
	},
	UserKey
>({
	key: `redactor`,
	default: { occlude: (updates) => updates },
})

export type ContinuitySyncTransactionUpdate = Pick<
	TransactionOutcomeEvent<any>,
	`epoch` | `id` | `output` | `subEvents` | `token`
>
export const unacknowledgedUpdatesAtoms: RegularAtomFamilyToken<
	ContinuitySyncTransactionUpdate[],
	UserKey
> = atomFamily<ContinuitySyncTransactionUpdate[], UserKey>({
	key: `unacknowledgedUpdates`,
	default: () => [],
})
