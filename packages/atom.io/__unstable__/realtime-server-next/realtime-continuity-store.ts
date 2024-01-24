import { selectorFamily } from "atom.io"
import type { TransactionUpdate } from "atom.io"
import type { JsonIO } from "atom.io/json"
import { completeUpdateAtoms, usersOfSockets } from "atom.io/realtime-server"
import { SyncGroup } from "./create-continuity"

export const redactorAtoms = selectorFamily<
	(update: TransactionUpdate<any>) => TransactionUpdate<any>,
	{ socketId: string; syncGroupKey: string }
>({
	key: `perspectiveRedactor`,
	get:
		({ socketId, syncGroupKey }) =>
		({ get, find }) => {
			const userKeyState = find(usersOfSockets.states.userKeyOfSocket, socketId)
			const userKey = get(userKeyState)
			if (!userKey) {
				throw new Error(
					`Tried to create a synchronizer for a socket that is not connected to a client.`,
				)
			}

			const syncGroup = SyncGroup.existing.get(syncGroupKey)
			if (!syncGroup) {
				throw new Error(
					`Tried to create a synchronizer for a sync group that does not exist.`,
				)
			}

			const userPerspectiveTokens = syncGroup.perspectives.map((perspective) => {
				const { perspectiveAtoms } = perspective
				const perspectiveToken = find(perspectiveAtoms, userKey)
				return perspectiveToken
			})
			const userPerspectives = userPerspectiveTokens.flatMap(
				(perspectiveToken) => {
					const perspective = get(perspectiveToken)
					const visibleTokens = [...perspective]
					return visibleTokens
				},
			)

			const filterTransactionUpdates = (
				visible: string[],
				transactionUpdate: TransactionUpdate<any>,
			) => {
				return transactionUpdate.updates
					.filter((update) => {
						if (`newValue` in update) {
							return visible.includes(update.key)
						}
						return true
					})
					.map((update) => {
						if (`updates` in update) {
							return {
								...update,
								updates: filterTransactionUpdates(visible, update),
							}
						}
					})
			}
			const filter: (updates: TransactionUpdate<any>) => TransactionUpdate<any> =
				(update) => {
					const visibleKeys = syncGroup.globals.map((atomToken) => atomToken.key)
					visibleKeys.push(...userPerspectives)
					return filterTransactionUpdates(visibleKeys, update)
				}
			return filter
		},
})
export const redactedPerspectiveUpdateSelectors = selectorFamily<
	Pick<
		TransactionUpdate<JsonIO>,
		`epoch` | `id` | `key` | `output` | `updates`
	> | null,
	{ socketId: string; syncGroupKey: string; updateId: string }
>({
	key: `redactedPerspectiveUpdate`,
	get:
		({ socketId, syncGroupKey, updateId }) =>
		({ get, find }) => {
			const updateState = find(completeUpdateAtoms, updateId)
			const update = get(updateState)
			const redactorKey = { socketId, syncGroupKey }
			const redactorState = find(redactorAtoms, redactorKey)
			const redact = get(redactorState)
			if (update) {
				return redact(update)
			}
			return null
		},
})
