import type { KeyedStateUpdate } from "atom.io"
import { getState } from "atom.io"
import { findRelations } from "atom.io/data"
import type { Store } from "atom.io/internal"
import {
	getUpdateFamily,
	getUpdateToken,
	setIntoStore,
	subscribeToTransaction,
} from "atom.io/internal"
import type { Json } from "atom.io/json"
import type { ContinuityToken } from "atom.io/realtime"

import type { Socket, UserKey } from ".."
import { userUnacknowledgedQueues } from "../realtime-server-stores"
import {
	type Actual,
	perspectiveAliases,
	type PerspectiveKey,
	type TransactionUpdateActual,
	type TransactionUpdateAlias,
} from "../realtime-server-stores/realtime-occlusion-store"

// const visibleKeys = continuity.globals
// 	.map((atom) => {
// 		if (atom.type === `atom`) {
// 			return atom.key
// 		}
// 		return getUpdateToken(atom).key
// 	})
// 	.concat(
// 		continuity.perspectives.flatMap((perspective) => {
// 			const { viewAtoms } = perspective
// 			const userPerspectiveTokenState = findInStore(
// 				store,
// 				viewAtoms,
// 				userKey,
// 			)
// 			const visibleTokens = getFromStore(
// 				store,
// 				userPerspectiveTokenState,
// 			)
// 			return visibleTokens.map((token) => {
// 				const key =
// 					token.type === `mutable_atom` ? `*` + token.key : token.key
// 				return key
// 			})
// 		}),
// 	)
// const redactedUpdates = redactTransactionUpdateContent(
// 	visibleKeys,
// 	update.updates,
// )
// const redactedUpdate = {
// 	...update,
// 	updates: redactedUpdates,
// }

export function aliasTransactionUpdate(
	store: Store,
	continuity: ContinuityToken,
	userKey: UserKey,
	update: TransactionUpdateActual,
): TransactionUpdateAlias {
	const visibleGlobalKeys = continuity.globals
		.map((atom) => {
			if (atom.type === `atom`) {
				return atom.key
			}
			return getUpdateToken(atom).key
		})
		.concat(
			continuity.dynamics.map(({ viewState }) => {
				if (viewState.type === `mutable_atom`) {
					return getUpdateToken(viewState).key
				}
				return viewState.key
			}),
		)
	const visibleFamilyKeys = continuity.dynamics.flatMap(
		({ resourceFamilies }) => {
			const familyKeys: string[] = []
			for (const resourceFamily of resourceFamilies) {
				if (resourceFamily.type === `mutable_atom_family`) {
					familyKeys.push(getUpdateFamily(store, resourceFamily).key)
				} else {
					familyKeys.push(resourceFamily.key)
				}
			}
			return familyKeys
		},
	)

	const updatesInPerspective: TransactionUpdateAlias[`updates`] = []
	for (const subUpdate of update.updates) {
		switch (subUpdate.type) {
			case `atom_update`:
				if (visibleGlobalKeys.includes(subUpdate.key)) {
					updatesInPerspective.push(subUpdate)
				}
				if (visibleFamilyKeys.includes(subUpdate.key)) {
					updatesInPerspective.push(subUpdate)
				}
				if (subUpdate.key.includes(`__`)) {
					const segments = subUpdate.key.split(`__`)
					let sub = false
					for (const segment of segments) {
						if (sub) {
							const actualKey: Actual = `__${segment}__`
							const perspectiveKey: PerspectiveKey = `T$--perspective==${actualKey}++${userKey}`
							const aliasKey = getState(
								findRelations(perspectiveAliases, perspectiveKey)
									.perspectiveKeyOfAlias,
							)
							if (aliasKey !== null) {
								updatesInPerspective.push({
									...subUpdate,
									key: aliasKey,
								})
							}
						}
						sub = !sub
					}
				}
				break
			case `selector_update`:
				// this doesn't seem to actually exist in transactions
				break
			case `transaction_update`:
				updatesInPerspective.push(
					aliasTransactionUpdate(store, continuity, userKey, subUpdate),
				)
				break
			case `state_creation`:
			case `state_disposal`:
				if (visibleGlobalKeys.includes(subUpdate.token.key)) {
					updatesInPerspective.push(subUpdate)
				}
				if (visibleFamilyKeys.includes(subUpdate.token.key)) {
					updatesInPerspective.push(subUpdate)
				}
				if (subUpdate.token.key.includes(`__`)) {
					const segments = subUpdate.token.key.split(`__`)
					let sub = false
					for (const segment of segments) {
						if (sub) {
							const actualKey: Actual = `__${segment}__`
							const perspectiveKey: PerspectiveKey = `T$--perspective==${actualKey}++${userKey}`
							const aliasKey = getState(
								findRelations(perspectiveAliases, perspectiveKey)
									.perspectiveKeyOfAlias,
							)
							if (aliasKey !== null) {
								updatesInPerspective.push({
									...subUpdate,
									token: {
										...subUpdate.token,
										key: aliasKey,
									},
								})
							}
						}
						sub = !sub
					}
				}
				break
			case `molecule_creation`:
			case `molecule_disposal`:
				if (
					subUpdate.subType === `modern` &&
					typeof subUpdate.key === `string`
				) {
					if (subUpdate.key.includes(`__`)) {
						const segments = subUpdate.key.split(`__`)
						let sub = false
						for (const segment of segments) {
							if (sub) {
								const actualKey: Actual = `__${segment}__`
								const perspectiveKey: PerspectiveKey = `T$--perspective==${actualKey}++${userKey}`
								const aliasKey = getState(
									findRelations(perspectiveAliases, perspectiveKey)
										.perspectiveKeyOfAlias,
								)
								if (aliasKey !== null) {
									updatesInPerspective.push({
										...subUpdate,
										key: aliasKey,
									})
								}
							}
							sub = !sub
						}
					}
				}
				break
		}
	}
	const aliasUpdate = {
		...update,
		alias: true,
		updates: updatesInPerspective,
	} satisfies TransactionUpdateAlias

	return aliasUpdate
}

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
					const aliasedUpdate = aliasTransactionUpdate(
						store,
						continuity,
						userKey,
						update,
					)
					setIntoStore(store, userUnacknowledgedQueues, userKey, (updates) => {
						if (aliasedUpdate) {
							updates.push(aliasedUpdate)
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
						aliasedUpdate as Json.Serializable,
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
