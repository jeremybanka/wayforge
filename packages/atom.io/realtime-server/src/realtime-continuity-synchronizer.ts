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
		console.log(
			`<<<<< ${store.config.name} synchronizing (${initialSocket.id}) to`,
			continuity,
		)
		let socket: Socket | null = initialSocket

		const continuityKey = continuity.key
		const userKeyState = findInStore(
			usersOfSockets.states.userKeyOfSocket,
			socket.id,
			store,
		)
		const userKey = getFromStore(userKeyState, store)
		if (!userKey) {
			console.log(
				`<<<<< ${store.config.name} no userKey`,
				userKey,
				socket.id,
				store.valueMap,
			)
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
				console.log(
					`>>>>> seeing ${userKey} on new socket ${newSocketKey} <<<<<`,
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
						// store.logger.info(`<<<<< userId`, userKey)
						const updateState = findInStore(
							completeUpdateAtoms,
							update.id,
							store,
						)
						console.log(`<<<<< ${userKey} updateState`, updateState)
						setIntoStore(updateState, update, store)
						console.log(`<<<<< setIntoStore`, userKey)
						const redactedUpdateKey = {
							userId: userKey,
							syncGroupKey: continuityKey,
							updateId: update.id,
						}
						console.log(`<<<<< ${userKey} redactedUpdateKey`, redactedUpdateKey)
						// if (userKey === `jane`) debugger
						const redactedUpdateState = findInStore(
							redactedPerspectiveUpdateSelectors,
							redactedUpdateKey,
							store,
						)
						console.log(
							`<<<<< ${userKey} redactedUpdateState`,
							redactedUpdateState,
						)
						const redactedUpdate = getFromStore(redactedUpdateState, store)
						console.log(`<<<<< ${userKey} redactedUpdate`, redactedUpdate)

						setIntoStore(
							userUnacknowledgedQueue,
							(updates) => {
								if (redactedUpdate) {
									updates.push(redactedUpdate)
									updates.sort((a, b) => a.epoch - b.epoch)
								}
								console.log(`<<<<< ${userKey} unacknowledgedUpdates`, updates)
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

		let i = 1
		let next = 1
		const retry = setInterval(() => {
			const toEmit = userUnacknowledgedUpdates[0]
			console.log(
				`<<<<< ${store.config.name} retrying ${userKey} (${i}/${next})`,
				socket?.id,
				userUnacknowledgedUpdates,
			)
			if (toEmit && i === next) {
				socket?.emit(`tx-new:${continuityKey}`, toEmit as Json.Serializable)
				next *= 2
			}

			i++
		}, 250)
		const trackClientAcknowledgement = (epoch: number) => {
			console.log(`<<<<< ${store.config.name} ack ${userKey}`, epoch)
			store.logger.info(
				`👍`,
				`continuity`,
				continuityKey,
				`${userKey} acknowledged epoch ${epoch}`,
			)
			i = 1
			next = 1
			const isUnacknowledged = userUnacknowledgedUpdates[0]?.epoch === epoch
			console.log(
				`<<<<< ${store.config.name} isUnacknowledged`,
				isUnacknowledged,
				userUnacknowledgedUpdates[0]?.epoch,
				epoch,
			)
			if (isUnacknowledged) {
				console.log(`<<<<< ${store.config.name} acknowledged ${userKey}`, epoch)
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
		socket.off(`ack:${continuityKey}`, trackClientAcknowledgement)
		socket.on(`ack:${continuityKey}`, trackClientAcknowledgement)

		return () => {
			clearInterval(retry)
			for (const unsubscribe of unsubscribeFunctions) unsubscribe()
			socket?.off(`ack:${continuityKey}`, trackClientAcknowledgement)
			socket?.off(`get:${continuityKey}`, sendInitialPayload)
			socket?.off(`tx-run:${continuityKey}`, fillTransactionRequest)
		}
	}
}
