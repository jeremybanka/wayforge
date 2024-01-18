import type { TransactionUpdate, TransactionUpdateContent } from "atom.io"
import { atomFamily, selectorFamily } from "atom.io"
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
