import type * as AtomIO from "atom.io"
import {
	IMPLICIT,
	actUponStore,
	findInStore,
	getFromStore,
	getJsonToken,
	isRootStore,
	setIntoStore,
	subscribeToState,
	subscribeToTransaction,
} from "atom.io/internal"
import type { Json, JsonIO } from "atom.io/json"
import type { ContinuityToken } from "atom.io/realtime"

import type { ServerConfig, Socket } from "."
import { socketAtoms, usersOfSockets } from "."

import {
	redactTransactionUpdateContent,
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

		const revealPerspectives = (): (() => void) => {
			const unsubscribeFunctions: (() => void)[] = []
			for (const perspective of continuity.perspectives) {
				const { viewAtoms } = perspective
				const userViewState = findInStore(viewAtoms, userKey, store)
				const unsubscribe = subscribeToState(
					userViewState,
					({ oldValue, newValue }) => {
						const oldKeys = oldValue.map((token) => token.key)
						const newKeys = newValue.map((token) => token.key)
						const concealed = oldValue.filter(
							(token) => !newKeys.includes(token.key),
						)
						const revealed = newValue
							.filter((token) => !oldKeys.includes(token.key))
							.flatMap((token) => {
								const resourceToken =
									token.type === `mutable_atom` ? getJsonToken(token) : token
								const resource = getFromStore(resourceToken, store)
								return [resourceToken, resource]
							})
						store.logger.info(
							`👁`,
							`atom`,
							perspective.resourceAtoms.key,
							`${userKey} has a new perspective`,
							{ oldKeys, newKeys, revealed, concealed },
						)
						if (revealed.length > 0) {
							socket?.emit(`reveal:${continuityKey}`, revealed)
						}
						if (concealed.length > 0) {
							socket?.emit(`conceal:${continuityKey}`, concealed)
						}
					},
					`sync-continuity:${continuityKey}:${userKey}:perspective:${perspective.resourceAtoms.key}`,
					store,
				)
				unsubscribeFunctions.push(unsubscribe)
			}
			return () => {
				for (const unsubscribe of unsubscribeFunctions) unsubscribe()
			}
		}
		const unsubscribeFromPerspectives = revealPerspectives()

		const sendInitialPayload = () => {
			const initialPayload: Json.Serializable[] = []
			for (const atom of continuity.globals) {
				const resourceToken =
					atom.type === `mutable_atom` ? getJsonToken(atom) : atom
				initialPayload.push(resourceToken, getFromStore(atom, store))
			}
			for (const perspective of continuity.perspectives) {
				const { viewAtoms, resourceAtoms } = perspective
				const userViewState = findInStore(viewAtoms, userKey, store)
				const userView = getFromStore(userViewState, store)
				store.logger.info(`👁`, `atom`, resourceAtoms.key, `${userKey} can see`, {
					viewAtoms,
					resourceAtoms,
					userView,
				})
				for (const visibleToken of userView) {
					const resourceToken =
						visibleToken.type === `mutable_atom`
							? getJsonToken(visibleToken)
							: visibleToken
					const resource = getFromStore(resourceToken, store)

					initialPayload.push(resourceToken, resource)
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
						try {
							const visibleKeys = continuity.globals
								.map((atom) => atom.key)
								.concat(
									continuity.perspectives.flatMap((perspective) => {
										const { viewAtoms } = perspective
										const userPerspectiveTokenState = findInStore(
											viewAtoms,
											userKey,
											store,
										)
										const visibleTokens = getFromStore(
											userPerspectiveTokenState,
											store,
										)
										return visibleTokens.map((token) => {
											const key =
												token.type === `mutable_atom`
													? `*` + token.key
													: token.key
											return key
										})
									}),
								)
							const redactedUpdates = redactTransactionUpdateContent(
								visibleKeys,
								update.updates,
							)
							const redactedUpdate = {
								...update,
								updates: redactedUpdates,
							}
							// setIntoStore(
							// 	userUnacknowledgedQueue,
							// 	(updates) => {
							// 		if (redactedUpdate) {
							// 			updates.push(redactedUpdate)
							// 			updates.sort((a, b) => a.epoch - b.epoch)
							// 		}
							// 		return updates
							// 	},
							// 	store,
							// )

							socket?.emit(
								`tx-new:${continuityKey}`,
								redactedUpdate as Json.Serializable,
							)
						} catch (thrown) {
							if (thrown instanceof Error) {
								store.logger.error(
									`❌`,
									`continuity`,
									continuityKey,
									`failed to send update from transaction ${transaction.key} to ${userKey}`,
									thrown.message,
								)
							}
						}
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
			try {
				actUponStore(
					{ type: `transaction`, key: transactionKey },
					updateId,
					store,
				)(...update.params)
			} catch (thrown) {
				if (thrown instanceof Error) {
					store.logger.error(
						`❌`,
						`continuity`,
						continuityKey,
						`failed to run transaction ${transactionKey} with update ${updateId}`,
						thrown.message,
					)
				}
			}
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

		// let i = 0
		// let n = 1
		// let retryTimeout: NodeJS.Timeout | undefined
		// const trackClientAcknowledgement = (epoch: number) => {
		// 	store.logger.info(
		// 		`👍`,
		// 		`continuity`,
		// 		continuityKey,
		// 		`${userKey} acknowledged epoch ${epoch}`,
		// 	)
		// 	const isUnacknowledged = userUnacknowledgedUpdates[0]?.epoch === epoch
		// 	if (isUnacknowledged) {
		// 		setIntoStore(
		// 			userUnacknowledgedQueue,
		// 			(updates) => {
		// 				updates.shift()
		// 				return updates
		// 			},
		// 			store,
		// 		)
		// 	}
		// }
		// subscribeToState(
		// 	userUnacknowledgedQueue,
		// 	({ newValue }) => {
		// 		if (newValue.length === 0) {
		// 			clearInterval(retryTimeout)
		// 			socket?.off(`ack:${continuityKey}`, trackClientAcknowledgement)
		// 			retryTimeout = undefined
		// 		}
		// 		if (newValue.length > 0) {
		// 			if (retryTimeout) {
		// 				return
		// 			}

		// 			socket?.on(`ack:${continuityKey}`, trackClientAcknowledgement)

		// 			retryTimeout = setInterval(() => {
		// 				i++
		// 				if (i === n) {
		// 					n += i
		// 					const toEmit = newValue[0]
		// 					if (!toEmit) return
		// 					store.logger.info(
		// 						`🔄`,
		// 						`continuity`,
		// 						continuityKey,
		// 						`${store.config.name} retrying ${userKey}`,
		// 						socket?.id,
		// 						newValue,
		// 					)
		// 					socket?.emit(
		// 						`tx-new:${continuityKey}`,
		// 						toEmit as Json.Serializable,
		// 					)
		// 				}
		// 			}, 250)
		// 		}
		// 	},
		// 	`sync-continuity:${continuityKey}:${userKey}`,
		// 	store,
		// )

		return () => {
			// clearInterval(retryTimeout)
			for (const unsubscribe of unsubscribeFunctions) unsubscribe()
			// socket?.off(`ack:${continuityKey}`, trackClientAcknowledgement)
			unsubscribeFromPerspectives()
			socket?.off(`get:${continuityKey}`, sendInitialPayload)
			socket?.off(`tx-run:${continuityKey}`, fillTransactionRequest)
		}
	}
}
