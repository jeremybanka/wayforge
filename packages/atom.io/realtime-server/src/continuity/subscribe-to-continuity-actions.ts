import type { TransactionUpdate, WritableFamilyToken } from "atom.io"
import { getState } from "atom.io"
import { findRelations } from "atom.io/data"
import type { Store } from "atom.io/internal"
import {
	getUpdateFamily,
	getUpdateToken,
	setIntoStore,
	subscribeToTransaction,
} from "atom.io/internal"
import type { Json, JsonIO } from "atom.io/json"
import type { ContinuityToken } from "atom.io/realtime"

import type { Socket, UserKey } from ".."
import { userUnacknowledgedQueues } from "../realtime-server-stores"
import {
	type Actual,
	perspectiveAliases,
	type PerspectiveKey,
} from "../realtime-server-stores/realtime-occlusion-store"
import type { TransactionResponse } from "./prepare-to-serve-transaction-request"

export function aliasTransactionUpdate(
	store: Store,
	continuity: ContinuityToken,
	userKey: UserKey,
	update: TransactionUpdate<JsonIO>,
): TransactionResponse {
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

	const updatesInPerspective: TransactionResponse[`updates`] = []
	for (const subUpdate of update.updates) {
		switch (subUpdate.type) {
			case `atom_update`:
				if (visibleGlobalKeys.includes(subUpdate.key)) {
					updatesInPerspective.push(subUpdate)
				}
				if (visibleFamilyKeys.includes(subUpdate.key)) {
					updatesInPerspective.push(subUpdate)
				}
				if (subUpdate.key.includes(`__`) && subUpdate.key.includes(`(`)) {
					const segments = subUpdate.key.split(`__`)
					const familyKey = segments[0].split(`(`)[0]
					let sub = false
					for (const segment of segments) {
						if (sub) {
							const actualKey: Actual = `__${segment}__`
							const perspectiveKey: PerspectiveKey = `T$--perspective==${actualKey}++${userKey}`
							const aliasKey = getState(
								findRelations(perspectiveAliases, perspectiveKey)
									.perspectiveKeyOfAlias,
							)
							let maskFamilyToken: WritableFamilyToken<any, any> | null = null
							for (const perspective of continuity.perspectives) {
								const { resourceFamilies } = perspective
								for (const [resourceFamily, maskFamily] of resourceFamilies) {
									if (resourceFamily.key === familyKey) {
										maskFamilyToken = maskFamily
										break
									}
								}
							}
							if (aliasKey !== null && maskFamilyToken !== null) {
								const newValue = getState(maskFamilyToken, subUpdate.key)
								updatesInPerspective.push({
									key: aliasKey,
									type: `atom_update`,
									// biome-ignore lint/style/noNonNullAssertion: <explanation>
									family: subUpdate.family!,
									newValue,
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
				// these don't fundamentally matter as events and can be deprecated from atom.io
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
	const response = {
		key: update.key,
		id: update.id,
		epoch: update.epoch,
		type: `transaction_update`,
		updates: updatesInPerspective,
	} satisfies TransactionResponse

	return response
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
