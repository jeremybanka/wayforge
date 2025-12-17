import type { Store } from "atom.io/internal"
import {
	findInStore,
	getFromStore,
	getUpdateToken,
	setIntoStore,
	subscribeToTransaction,
} from "atom.io/internal"
import type { Json } from "atom.io/json"
import type { ContinuityToken, Socket, UserKey } from "atom.io/realtime"

import {
	redactTransactionUpdateContent,
	unacknowledgedUpdatesAtoms,
} from "./continuity-store"

export function provideOutcomes(
	store: Store,
	socket: Socket,
	continuity: ContinuityToken,
	userKey: UserKey,
): () => void {
	const continuityKey = continuity.key
	const unsubscribeFunctions = new Set<() => void>()

	for (const transaction of continuity.actions) {
		const unsubscribeFromTransaction = subscribeToTransaction(
			store,
			transaction,
			`sync-continuity:${continuityKey}:${userKey}`,
			(outcomes) => {
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
						outcomes.subEvents,
					)
					const redactedUpdate = {
						...outcomes,
						updates: redactedUpdates,
					}
					setIntoStore(store, unacknowledgedUpdatesAtoms, userKey, (updates) => {
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

					socket.emit(
						`tx-new:${continuityKey}`,
						redactedUpdate as unknown as Json.Serializable,
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
		)
		unsubscribeFunctions.add(unsubscribeFromTransaction)
	}
	return () => {
		for (const unsubscribe of unsubscribeFunctions) unsubscribe()
	}
}
