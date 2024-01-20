import type { TransactionUpdate, TransactionUpdateContent } from "atom.io"
import { atomFamily, selectorFamily } from "atom.io"
import { SyncGroup } from "~/packages/atom.io/__unstable__/create-realtime-sync-group"
import { socketsOfClients } from "./server-client-store"

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

export const redactorAtoms = selectorFamily<
	(update: TransactionUpdate<any>) => TransactionUpdate<any>,
	{ socketId: string; syncGroupKey: string }
>({
	key: `perspectiveRedactor`,
	get:
		({ socketId, syncGroupKey }) =>
		({ get, find }) => {
			const clientIdState = find(
				socketsOfClients.states.clientKeyOfSocket,
				socketId,
			)
			const clientId = get(clientIdState)
			if (!clientId) {
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

			const clientPerspectiveTokens = syncGroup.perspectives.map(
				(perspective) => {
					const { perspectiveAtoms } = perspective
					const perspectiveToken = find(perspectiveAtoms, clientId)
					return perspectiveToken
				},
			)
			const clientPerspectives = clientPerspectiveTokens.flatMap(
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
					visibleKeys.push(...clientPerspectives)
					return filterTransactionUpdates(visibleKeys, update)
				}
			return filter
		},
})
export const redactedPerspectiveUpdateSelectors = selectorFamily<
	TransactionUpdate<any> | null,
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

export const clientUnacknowledgedUpdatesState = atomFamily<
	TransactionUpdate<any>[],
	string
>({
	key: `unacknowledgedUpdates`,
	default: () => [],
})

export const socketUnacknowledgedUpdatesSelectors = selectorFamily<
	TransactionUpdate<any>[],
	string
>({
	key: `socketUnacknowledgedUpdates`,
	get:
		(socketId) =>
		({ get, find }) => {
			const clientKeyState = find(
				socketsOfClients.states.clientKeyOfSocket,
				socketId,
			)
			const clientKey = get(clientKeyState)
			if (!clientKey) {
				return []
			}
			const unacknowledgedUpdatesState = find(
				clientUnacknowledgedUpdatesState,
				clientKey,
			)
			const unacknowledgedUpdates = get(unacknowledgedUpdatesState)
			return unacknowledgedUpdates
		},
	set:
		(socketId) =>
		({ set, get, find }, newUpdates) => {
			const clientKeyState = find(
				socketsOfClients.states.clientKeyOfSocket,
				socketId,
			)
			const clientKey = get(clientKeyState)
			if (!clientKey) {
				return
			}
			const unacknowledgedUpdatesState = find(
				clientUnacknowledgedUpdatesState,
				clientKey,
			)
			set(unacknowledgedUpdatesState, newUpdates)
		},
})

export const clientEpochAtoms = atomFamily<number | null, string>({
	key: `clientEpoch`,
	default: null,
})

export const socketEpochSelectors = selectorFamily<number | null, string>({
	key: `socketEpoch`,
	get:
		(socketId) =>
		({ get, find }) => {
			const clientKeyState = find(
				socketsOfClients.states.clientKeyOfSocket,
				socketId,
			)
			const clientKey = get(clientKeyState)
			if (!clientKey) {
				return null
			}
			const clientEpochState = find(clientEpochAtoms, clientKey)
			const clientEpoch = get(clientEpochState)
			return clientEpoch
		},
	set:
		(socketId) =>
		({ set, get, find }, newEpoch) => {
			const clientKeyState = find(
				socketsOfClients.states.clientKeyOfSocket,
				socketId,
			)
			const clientKey = get(clientKeyState)
			if (!clientKey) {
				return
			}
			const clientEpochState = find(clientEpochAtoms, clientKey)
			set(clientEpochState, newEpoch)
		},
})
