import type { TransactionUpdate, TransactionUpdateContent } from "atom.io"
import { atomFamily, selectorFamily } from "atom.io"
import { usersOfSockets } from "./server-user-store"

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

export const userUnacknowledgedUpdatesAtoms = atomFamily<
	Pick<TransactionUpdate<any>, `epoch` | `id` | `key` | `output` | `updates`>[],
	string
>({
	key: `unacknowledgedUpdates`,
	default: () => [],
})

export const socketUnacknowledgedUpdatesSelectors = selectorFamily<
	Pick<TransactionUpdate<any>, `epoch` | `id` | `key` | `output` | `updates`>[],
	string
>({
	key: `socketUnacknowledgedUpdates`,
	get:
		(socketId) =>
		({ get, find }) => {
			const userKeyState = find(usersOfSockets.states.userKeyOfSocket, socketId)
			const userKey = get(userKeyState)
			if (!userKey) {
				return []
			}
			const unacknowledgedUpdatesState = find(
				userUnacknowledgedUpdatesAtoms,
				userKey,
			)
			const unacknowledgedUpdates = get(unacknowledgedUpdatesState)
			return unacknowledgedUpdates
		},
	set:
		(socketId) =>
		({ set, get, find }, newUpdates) => {
			const userKeyState = find(usersOfSockets.states.userKeyOfSocket, socketId)
			const userKey = get(userKeyState)
			if (!userKey) {
				return
			}
			const unacknowledgedUpdatesState = find(
				userUnacknowledgedUpdatesAtoms,
				userKey,
			)
			set(unacknowledgedUpdatesState, newUpdates)
		},
})

export const userEpochAtoms = atomFamily<number | null, string>({
	key: `clientEpoch`,
	default: null,
})

export const socketEpochSelectors = selectorFamily<number | null, string>({
	key: `socketEpoch`,
	get:
		(socketId) =>
		({ get, find }) => {
			const userKeyState = find(usersOfSockets.states.userKeyOfSocket, socketId)
			const userKey = get(userKeyState)
			if (!userKey) {
				return null
			}
			const userEpochState = find(userEpochAtoms, userKey)
			const userEpoch = get(userEpochState)
			return userEpoch
		},
	set:
		(socketId) =>
		({ set, get, find }, newEpoch) => {
			const userKeyState = find(usersOfSockets.states.userKeyOfSocket, socketId)
			const userKey = get(userKeyState)
			if (!userKey) {
				return
			}
			const userEpochState = find(userEpochAtoms, userKey)
			set(userEpochState, newEpoch)
		},
})
