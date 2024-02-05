import type * as AtomIO from "atom.io"
import {
	IMPLICIT,
	actUponStore,
	findInStore,
	getFromStore,
	isRootStore,
	setIntoStore,
	subscribeToState,
	subscribeToTransaction,
} from "atom.io/internal"
import type { Json, JsonIO } from "atom.io/json"
import type { ContinuityToken } from "atom.io/realtime"

import type { ServerConfig, Socket } from "."
import { socketAtoms, usersOfSockets } from "."
import { redactedPerspectiveUpdateSelectors } from "./realtime-server-stores"
import {
	completeUpdateAtoms,
	userUnacknowledgedQueues,
} from "./realtime-server-stores"

export type RealtimeContinuitySynchronizer = ReturnType<
	typeof realtimeContinuitySynchronizer
>
export function realtimeContinuitySynchronizer({
	socket: initialSocket,
	store = IMPLICIT.STORE,
}: ServerConfig) {
	return function synchronizer(continuity: ContinuityToken): () => void {
		let socket: Socket | null = initialSocket

		const continuityKey = continuity.key
		const userKeyState = findInStore(
			usersOfSockets.states.userKeyOfSocket,
			socket.id,
			store,
		)
		const userKey = getFromStore(userKeyState, store)
		if (!userKey) {
			store.logger.error(
				`❌`,
				`continuity`,
				continuityKey,
				`Tried to create a synchronizer for a socket (${socket.id}) that is not connected to a user.`,
			)
			return () => {}
		}
		const socketKeyState = findInStore(
			usersOfSockets.states.socketKeyOfUser,
			userKey,
			store,
		)
		subscribeToState(
			socketKeyState,
			({ newValue: newSocketKey }) => {
				store.logger.info(
					`👋`,
					`continuity`,
					continuityKey,
					`seeing ${userKey} on new socket ${newSocketKey}`,
				)
				if (newSocketKey === null) {
					store.logger.error(
						`❌`,
						`continuity`,
						continuityKey,
						`Tried to create a synchronizer for a user (${userKey}) that is not connected to a socket.`,
					)
					return
				}
				const newSocketState = findInStore(socketAtoms, newSocketKey, store)
				const newSocket = getFromStore(newSocketState, store)
				socket = newSocket
			},
			`sync-continuity:${continuityKey}:${userKey}`,
			store,
		)

		const userUnacknowledgedQueue = findInStore(
			userUnacknowledgedQueues,
			userKey,
			store,
		)
		const userUnacknowledgedUpdates = getFromStore(
			userUnacknowledgedQueue,
			store,
		)
		const unsubscribeFunctions: (() => void)[] = []

		const sendInitialPayload = () => {
			const initialPayload: Json.Serializable[] = []
			for (const atom of continuity.globals) {
				initialPayload.push(atom, getFromStore(atom, store))
			}
			for (const { perspectiveAtoms } of continuity.perspectives) {
				const perspectiveTokensState = findInStore(
					perspectiveAtoms,
					userKey,
					store,
				)
				const perspectiveTokens = getFromStore(perspectiveTokensState, store)
				for (const perspectiveToken of perspectiveTokens) {
					const resource = getFromStore(perspectiveToken, store)
					initialPayload.push(perspectiveToken, resource)
				}
			}

			const epoch = isRootStore(store)
				? store.transactionMeta.epoch.get(continuityKey) ?? null
				: null
			socket?.emit(`continuity-init:${continuityKey}`, epoch, initialPayload)

			for (const transaction of continuity.actions) {
				const unsubscribeFromTransaction = subscribeToTransaction(
					transaction,
					(update) => {
						// store.logger.info(`userId`, userKey)
						const updateState = findInStore(
							completeUpdateAtoms,
							update.id,
							store,
						)
						setIntoStore(updateState, update, store)
						const redactedUpdateKey = {
							userId: userKey,
							syncGroupKey: continuityKey,
							updateId: update.id,
						}
						const redactedUpdateState = findInStore(
							redactedPerspectiveUpdateSelectors,
							redactedUpdateKey,
							store,
						)

						const redactedUpdate = getFromStore(redactedUpdateState, store)

						setIntoStore(
							userUnacknowledgedQueue,
							(updates) => {
								if (redactedUpdate) {
									updates.push(redactedUpdate)
									updates.sort((a, b) => a.epoch - b.epoch)
								}
								return updates
							},
							store,
						)

						socket?.emit(
							`tx-new:${continuityKey}`,
							redactedUpdate as Json.Serializable,
						)
					},
					`sync-continuity:${continuityKey}:${userKey}`,
					store,
				)
				unsubscribeFunctions.push(unsubscribeFromTransaction)
			}
		}
		socket.off(`get:${continuityKey}`, sendInitialPayload)
		socket.on(`get:${continuityKey}`, sendInitialPayload)

		const fillTransactionRequest = (
			update: Pick<AtomIO.TransactionUpdate<JsonIO>, `id` | `key` | `params`>,
		) => {
			store.logger.info(`🛎️`, `continuity`, continuityKey, `received`, update)
			const transactionKey = update.key
			const updateId = update.id
			const performanceKey = `tx-run:${transactionKey}:${updateId}`
			const performanceKeyStart = `${performanceKey}:start`
			const performanceKeyEnd = `${performanceKey}:end`
			performance.mark(performanceKeyStart)
			actUponStore(
				{ type: `transaction`, key: transactionKey },
				updateId,
				store,
			)(...update.params)
			performance.mark(performanceKeyEnd)
			const metric = performance.measure(
				performanceKey,
				performanceKeyStart,
				performanceKeyEnd,
			)
			store?.logger.info(
				`🚀`,
				`transaction`,
				transactionKey,
				updateId,
				metric.duration,
			)
		}
		socket.off(`tx-run:${continuityKey}`, fillTransactionRequest)
		socket.on(`tx-run:${continuityKey}`, fillTransactionRequest)

		let i = 0
		let n = 1
		let retryTimeout: NodeJS.Timeout | undefined
		const trackClientAcknowledgement = (epoch: number) => {
			store.logger.info(
				`👍`,
				`continuity`,
				continuityKey,
				`${userKey} acknowledged epoch ${epoch}`,
			)
			const isUnacknowledged = userUnacknowledgedUpdates[0]?.epoch === epoch
			if (isUnacknowledged) {
				setIntoStore(
					userUnacknowledgedQueue,
					(updates) => {
						updates.shift()
						return updates
					},
					store,
				)
			}
		}
		subscribeToState(
			userUnacknowledgedQueue,
			({ newValue }) => {
				if (newValue.length === 0) {
					clearInterval(retryTimeout)
					socket?.off(`ack:${continuityKey}`, trackClientAcknowledgement)
					retryTimeout = undefined
				}
				if (newValue.length > 0) {
					if (retryTimeout) {
						return
					}

					socket?.on(`ack:${continuityKey}`, trackClientAcknowledgement)

					retryTimeout = setInterval(() => {
						i++
						if (i === n) {
							n += i
							const toEmit = newValue[0]
							if (!toEmit) return
							store.logger.info(
								`🔄`,
								`continuity`,
								continuityKey,
								`${store.config.name} retrying ${userKey}`,
								socket?.id,
								newValue,
							)
							socket?.emit(
								`tx-new:${continuityKey}`,
								toEmit as Json.Serializable,
							)
						}
					}, 250)
				}
			},
			`sync-continuity:${continuityKey}:${userKey}`,
			store,
		)

		return () => {
			clearInterval(retryTimeout)
			for (const unsubscribe of unsubscribeFunctions) unsubscribe()
			socket?.off(`ack:${continuityKey}`, trackClientAcknowledgement)
			socket?.off(`get:${continuityKey}`, sendInitialPayload)
			socket?.off(`tx-run:${continuityKey}`, fillTransactionRequest)
		}
	}
}
