import { selectorFamily } from "atom.io"
import type { TransactionUpdate } from "atom.io"
import type { JsonIO } from "atom.io/json"
import { SyncGroup } from "atom.io/realtime"
import { completeUpdateAtoms } from "atom.io/realtime-server"

const redactorAtoms = selectorFamily<
	(update: TransactionUpdate<any>) => TransactionUpdate<any>,
	{ userId: string; syncGroupKey: string }
>({
	key: `perspectiveRedactor`,
	get:
		({ userId, syncGroupKey }) =>
		({ get, find }) => {
			const syncGroup = SyncGroup.existing.get(syncGroupKey)
			if (!syncGroup) {
				throw new Error(
					`Tried to create a synchronizer for a sync group that does not exist.`,
				)
			}

			const userPerspectiveTokens = syncGroup.perspectives.flatMap(
				({ perspectiveAtoms, resourceAtoms }) => {
					const userPerspectiveToken = find(perspectiveAtoms, userId)
					const userPerspective = get(userPerspectiveToken)
					const visibleTokens = [...userPerspective].map((subKey) => {
						const resourceToken = find(resourceAtoms, subKey)
						return resourceToken.key
					})

					return visibleTokens
				},
			)

			const filterTransactionUpdate = (
				visible: string[],
				transactionUpdate: TransactionUpdate<any>,
			): TransactionUpdate<any> => {
				const updates = transactionUpdate.updates
					.filter((update) => {
						if (`newValue` in update) {
							return visible.includes(update.key)
						}
						return true
					})
					.map((update) => {
						if (`updates` in update) {
							return filterTransactionUpdate(visible, update)
						}
						return update
					})
				const filtered: TransactionUpdate<any> = {
					...transactionUpdate,
					updates,
				}
				return filtered
			}
			const filter: (updates: TransactionUpdate<any>) => TransactionUpdate<any> =
				(update) => {
					const visibleKeys: string[] = syncGroup.globals.map(
						(atomToken) => atomToken.key,
					)
					visibleKeys.push(...userPerspectiveTokens)
					return filterTransactionUpdate(visibleKeys, update)
				}
			return filter
		},
})
export const redactedPerspectiveUpdateSelectors = selectorFamily<
	Pick<
		TransactionUpdate<JsonIO>,
		`epoch` | `id` | `key` | `output` | `updates`
	> | null,
	{ userId: string; syncGroupKey: string; updateId: string }
>({
	key: `redactedPerspectiveUpdate`,
	get:
		({ userId, syncGroupKey, updateId }) =>
		({ get, find }) => {
			const updateState = find(completeUpdateAtoms, updateId)
			const update = get(updateState)
			const redactorKey = { userId, syncGroupKey }
			const redactorState = find(redactorAtoms, redactorKey)
			const redact = get(redactorState)
			if (update) {
				return redact(update)
			}
			return null
		},
})
