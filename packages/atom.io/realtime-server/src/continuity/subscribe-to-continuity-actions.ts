import type { Store } from "atom.io/internal"
import {
	findInStore,
	getFromStore,
	getJsonToken,
	getUpdateToken,
	isRootStore,
	setIntoStore,
	subscribeToTransaction,
} from "atom.io/internal"
import type { Json } from "atom.io/json"
import type { ContinuityToken } from "atom.io/realtime"

import type { Socket, UserKey } from ".."
import {
	redactTransactionUpdateContent,
	userUnacknowledgedQueues,
} from "../realtime-server-stores"

export function subscribeToContinuityActions(
	store: Store,
	continuity: ContinuityToken,
	userKey: UserKey,
	socket: Socket | null,
): (() => void)[] {
	const continuityKey = continuity.key
	const unsubscribeFunctions: (() => void)[] = []

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
										token.type === `mutable_atom` ? `*` + token.key : token.key
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
					setIntoStore(store, userUnacknowledgedQueues, userKey, (updates) => {
						if (redactedUpdate) {
							updates.push(redactedUpdate)
							updates.sort((a, b) => a.epoch - b.epoch)
							store.logger.info(
								`👍`,
								`continuity`,
								continuityKey,
								`${userKey} unacknowledged update queue now has`,
								updates.length,
								`items`,
							)
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
							`${userKey} failed to send update from transaction ${transaction.key} to ${userKey}`,
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
	return unsubscribeFunctions
}
