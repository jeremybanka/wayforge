import type * as AtomIO from "atom.io"
import { findRelationsInStore } from "atom.io/data"
import {
	actUponStore,
	findInStore,
	getFromStore,
	getJsonToken,
	getUpdateToken,
	IMPLICIT,
	isRootStore,
	setIntoStore,
	subscribeToState,
	subscribeToTransaction,
} from "atom.io/internal"
import type { Json, JsonIO } from "atom.io/json"
import type { ContinuityToken } from "atom.io/realtime"

import type { ServerConfig, Socket, SocketKey } from "."
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
		const userKeyState = findRelationsInStore(
			usersOfSockets,
			`socket::${socket.id}`,
			store,
		).userKeyOfSocket
		const userKey = getFromStore(store, userKeyState)
		if (!userKey) {
			store.logger.error(
				`❌`,
				`continuity`,
				continuityKey,
				`Tried to create a synchronizer for a socket (${socket.id}) that is not connected to a user.`,
			)
			return () => {}
		}

		const socketKeyState = findRelationsInStore(
			usersOfSockets,
			userKey,
			store,
		).socketKeyOfUser
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
					store.logger.warn(
						`❌`,
						`continuity`,
						continuityKey,
						`User (${userKey}) is not connected to a socket, waiting for them to reappear.`,
					)
					return
				}
				const newSocketState = findInStore(store, socketAtoms, newSocketKey)
				const newSocket = getFromStore(store, newSocketState)
				socket = newSocket
				for (const unacknowledgedUpdate of userUnacknowledgedUpdates) {
					socket?.emit(
						`tx-new:${continuityKey}`,
						unacknowledgedUpdate as Json.Serializable,
					)
				}
			},
			`sync-continuity:${continuityKey}:${userKey}`,
			store,
		)

		const userUnacknowledgedQueue = findInStore(
			store,
			userUnacknowledgedQueues,
			userKey,
		)
		const userUnacknowledgedUpdates = getFromStore(
			store,
			userUnacknowledgedQueue,
		)
		const unsubscribeFunctions: (() => void)[] = []

		const revealPerspectives = (): (() => void) => {
			const unsubFns: (() => void)[] = []
			for (const perspective of continuity.perspectives) {
				const { viewAtoms } = perspective
				const userViewState = findInStore(store, viewAtoms, userKey)
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
									token.type === `mutable_atom`
										? getJsonToken(store, token)
										: token
								const resource = getFromStore(store, resourceToken)
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
				unsubFns.push(unsubscribe)
			}
			return () => {
				for (const unsubscribe of unsubFns) unsubscribe()
			}
		}
		const unsubscribeFromPerspectives = revealPerspectives()

		const sendInitialPayload = () => {
			const initialPayload: Json.Serializable[] = []
			for (const atom of continuity.globals) {
				const resourceToken =
					atom.type === `mutable_atom` ? getJsonToken(store, atom) : atom
				const resource = getFromStore(store, resourceToken)
				initialPayload.push(resourceToken, resource)
			}
			for (const perspective of continuity.perspectives) {
				const { viewAtoms, resourceAtoms } = perspective
				const userViewState = findInStore(store, viewAtoms, userKey)
				const userView = getFromStore(store, userViewState)
				store.logger.info(`👁`, `atom`, resourceAtoms.key, `${userKey} can see`, {
					viewAtoms,
					resourceAtoms,
					userView,
				})
				for (const visibleToken of userView) {
					const resourceToken =
						visibleToken.type === `mutable_atom`
							? getJsonToken(store, visibleToken)
							: visibleToken
					const resource = getFromStore(store, resourceToken)

					initialPayload.push(resourceToken, resource)
				}
			}

			const epoch = isRootStore(store)
				? (store.transactionMeta.epoch.get(continuityKey) ?? null)
				: null

			socket?.emit(`continuity-init:${continuityKey}`, epoch, initialPayload)

			for (const transaction of continuity.actions) {
				const unsubscribeFromTransaction = subscribeToTransaction(
					transaction,
					(update) => {
						try {
							const visibleKeys = continuity.globals
								.map((atom) => {
									if (atom.type === `atom`) {
										return atom.key
									}
									return getUpdateToken(atom).key
								})
								.concat(
									continuity.perspectives.flatMap((perspective) => {
										const { viewAtoms } = perspective
										const userPerspectiveTokenState = findInStore(
											store,
											viewAtoms,
											userKey,
										)
										const visibleTokens = getFromStore(
											store,
											userPerspectiveTokenState,
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
							setIntoStore(store, userUnacknowledgedQueue, (updates) => {
								if (redactedUpdate) {
									updates.push(redactedUpdate)
									updates.sort((a, b) => a.epoch - b.epoch)
								}
								return updates
							})

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

			const valuesOfCardsViewKey = `valuesOfCardsView("${userKey}")`
			const rootsOfCardValueView =
				store.selectorAtoms.getRelatedKeys(valuesOfCardsViewKey)
			const myCardValueView = store.valueMap.get(valuesOfCardsViewKey)

			store.logger.info(
				`👁`,
				`continuity`,
				continuityKey,
				`seeing ${userKey} card values`,
				{
					valuesOfCardsViewKey,
					rootsOfCardValueView,
					myCardValueView,
				},
			)
		}
		socket.off(`tx-run:${continuityKey}`, fillTransactionRequest)
		socket.on(`tx-run:${continuityKey}`, fillTransactionRequest)

		const trackClientAcknowledgement = (epoch: number) => {
			store.logger.info(
				`👍`,
				`continuity`,
				continuityKey,
				`${userKey} acknowledged epoch ${epoch}`,
			)
			const isUnacknowledged = userUnacknowledgedUpdates[0]?.epoch === epoch
			if (isUnacknowledged) {
				setIntoStore(store, userUnacknowledgedQueue, (updates) => {
					updates.shift()
					return updates
				})
			}
		}
		socket?.on(`ack:${continuityKey}`, trackClientAcknowledgement)

		return () => {
			// clearInterval(retryTimeout)
			for (const unsubscribe of unsubscribeFunctions) unsubscribe()
			socket?.off(`ack:${continuityKey}`, trackClientAcknowledgement)
			unsubscribeFromPerspectives()
			socket?.off(`get:${continuityKey}`, sendInitialPayload)
			socket?.off(`tx-run:${continuityKey}`, fillTransactionRequest)
		}
	}
}
